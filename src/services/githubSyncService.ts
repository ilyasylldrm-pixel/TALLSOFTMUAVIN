import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);
const CONFIG_PATH = path.join(process.cwd(), "data", "github-config.json");
const CENTRAL_SECRETS_PATH = process.env.CENTRAL_SECRETS_PATH
  ? path.resolve(process.cwd(), process.env.CENTRAL_SECRETS_PATH)
  : path.join(process.cwd(), "data", "central_secrets.json");
const INITIAL_WORKSPACE_BASE_SHA = "00c1ae3322ccc724ea2b9e735e9090e58b0d52e9";

function isKnownExpiredLegacyToken(token?: string): boolean {
  const clean = (token || "").trim();
  if (!clean) return false;
  return clean.startsWith("ghp_Y2c") && clean.endsWith("IzYx");
}

function readCentralSecretPat(): string {
  try {
    if (fs.existsSync(CENTRAL_SECRETS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CENTRAL_SECRETS_PATH, "utf-8"));
      const raw = typeof parsed?.muavin_github_pat === "string" ? parsed.muavin_github_pat.trim() : "";
      if (raw && !isKnownExpiredLegacyToken(raw)) {
        return raw;
      }
    }
  } catch {
    // ignore
  }
  return "";
}

function syncCentralSecretPat(token?: string, clear = false): void {
  try {
    let existing: Record<string, string> = {};
    if (fs.existsSync(CENTRAL_SECRETS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CENTRAL_SECRETS_PATH, "utf-8"));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        existing = { ...parsed };
      }
    }
    if (clear) {
      delete existing.muavin_github_pat;
    } else if (token && token.trim() && !isKnownExpiredLegacyToken(token)) {
      existing.muavin_github_pat = token.trim();
    } else {
      return;
    }
    const dir = path.dirname(CENTRAL_SECRETS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CENTRAL_SECRETS_PATH, JSON.stringify(existing, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

export interface GitHubSyncConfig {
  repoUrl: string;
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  lastSyncedAt?: string;
  lastBaseSha?: string;
  autoSync?: boolean;
}

export type GitHubTokenErrorCode =
  | "MISSING_TOKEN"
  | "INVALID_TOKEN"
  | "REPO_NOT_FOUND"
  | "TOKEN_READ_ONLY"
  | "NETWORK_ERROR";

export interface GitHubSyncStatus {
  initialized: boolean;
  branch: string;
  repoUrl: string;
  owner: string;
  repo: string;
  hasToken: boolean;
  maskedToken?: string;
  tokenCanPush?: boolean;
  tokenErrorCode?: GitHubTokenErrorCode;
  tokenPermissionWarning?: string;
  isClean: boolean;
  uncommittedCount: number;
  uncommittedFiles: string[];
  aheadCount?: number;
  behindCount?: number;
  lastCommit?: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
  };
  remoteCommit?: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
  };
  lastSyncedAt?: string;
  actionsUrl: string;
  repoWebUrl: string;
  deployUrl: string;
}

export interface TokenPermissionCheckResult {
  valid: boolean;
  canRead: boolean;
  canPush: boolean;
  isFineGrained: boolean;
  repoName?: string;
  isPrivate?: boolean;
  defaultBranch?: string;
  permissions?: Record<string, boolean>;
  errorCode?: GitHubTokenErrorCode;
  errorReason?: string;
}

function maskToken(token?: string): string {
  if (!token) return "";
  if (token.length <= 8) return "••••••••";
  return token.substring(0, 7) + "••••••••" + token.substring(token.length - 4);
}

function buildGitAuthArg(token?: string): string {
  if (!token || !token.trim()) return "";
  const basic = Buffer.from(`x-access-token:${token.trim()}`).toString("base64");
  return `-c http.extraHeader="Authorization: Basic ${basic}"`;
}

export class GitHubSyncService {
  private configCache: GitHubSyncConfig | null = null;
  private gitLockPromise: Promise<any> = Promise.resolve();
  private lastTokenCheck: {
    token: string;
    owner: string;
    repo: string;
    checkedAt: number;
    result: TokenPermissionCheckResult;
  } | null = null;

  private async withGitLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.gitLockPromise;
    let release!: () => void;
    this.gitLockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      await prev.catch(() => {});
      return await fn();
    } finally {
      release();
    }
  }

  private clearGitIndexLock(cwd: string): void {
    try {
      const lockFiles = ["index.lock", "HEAD.lock", "config.lock"];
      for (const file of lockFiles) {
        const lockPath = path.join(cwd, ".git", file);
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
        }
      }
    } catch {
      // ignore if already removed
    }
  }

  private async restoreDeletedBuildArtifacts(cwd: string): Promise<void> {
    try {
      const distIndex = path.join(cwd, "dist", "index.html");
      if (!fs.existsSync(distIndex)) {
        this.clearGitIndexLock(cwd);
        await execPromise("git checkout HEAD -- dist", { cwd }).catch(() => {});
      }
    } catch {
      // ignore if HEAD does not have dist
    }
  }

  private async untrackRuntimeArtifacts(cwd: string): Promise<void> {
    this.clearGitIndexLock(cwd);
    await execPromise(
      "git rm -r --cached --ignore-unmatch .aistudio data/whatsapp_logs.json data/whatsapp_sessions data/github-config.json data/github-sync-state.json data/central_sessions.json data/central_secrets.json data/.trendyol.key data/.trendyol.keys.json data/trendyol_store.json data/.mysoft.key data/mysoft_connections.json",
      { cwd }
    ).catch(() => {});
  }

  private async safeGitAddAll(cwd: string): Promise<void> {
    await this.restoreDeletedBuildArtifacts(cwd);
    for (let attempt = 0; attempt < 3; attempt++) {
      this.clearGitIndexLock(cwd);
      try {
        await execPromise("git add -A", { cwd });
        await this.untrackRuntimeArtifacts(cwd);
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
          continue;
        }
        this.clearGitIndexLock(cwd);
        await execPromise("git add -u", { cwd }).catch(() => {});
        await this.untrackRuntimeArtifacts(cwd);
      }
    }
  }

  private async fetchRemoteCommitViaApi(
    owner: string,
    repo: string,
    branch: string,
    token?: string
  ): Promise<GitHubSyncStatus["remoteCommit"] | undefined> {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Muavin-ERP-Sync",
      };
      if (token && token.trim() && !isKnownExpiredLegacyToken(token)) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
      let res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
        { headers }
      );
      // If stored token expired on a public repo, retry unauthenticated so remote SHA still loads
      if (res.status === 401 && headers.Authorization) {
        delete headers.Authorization;
        res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
          { headers }
        );
      }
      if (!res.ok) return undefined;
      const data: any = await res.json();
      if (!data?.sha) return undefined;
      return {
        sha: data.sha,
        shortSha: String(data.sha).substring(0, 7),
        message: String(data.commit?.message || "").split("\n")[0],
        author: data.commit?.author?.name || data.author?.login || "Muavin",
        date: data.commit?.author?.date || new Date().toISOString(),
      };
    } catch {
      return undefined;
    }
  }

  public getConfig(): GitHubSyncConfig {
    const envTokenRaw = (process.env.GITHUB_TOKEN || "").trim();
    const envToken = isKnownExpiredLegacyToken(envTokenRaw) ? "" : envTokenRaw;
    const centralSecretToken = readCentralSecretPat();

    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        const rawSavedToken = typeof parsed.token === "string" ? parsed.token.trim() : "";
        const effectiveToken = !isKnownExpiredLegacyToken(rawSavedToken) && rawSavedToken
          ? rawSavedToken
          : centralSecretToken || envToken;

        this.configCache = {
          repoUrl: parsed.repoUrl || "https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git",
          owner: parsed.owner || "ilyasylldrm-pixel",
          repo: parsed.repo || "TALLSOFTMUAVIN",
          branch: parsed.branch || "main",
          token: effectiveToken || undefined,
          lastSyncedAt: parsed.lastSyncedAt,
          lastBaseSha: parsed.lastBaseSha || INITIAL_WORKSPACE_BASE_SHA,
          autoSync: parsed.autoSync,
        };
        return this.configCache;
      }
    } catch (err) {
      console.warn("[GitHubSync] Warning reading config file:", err);
    }

    return {
      repoUrl: "https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git",
      owner: "ilyasylldrm-pixel",
      repo: "TALLSOFTMUAVIN",
      branch: "main",
      token: centralSecretToken || envToken || undefined,
      lastBaseSha: INITIAL_WORKSPACE_BASE_SHA,
    };
  }

  public saveConfig(newConfig: Partial<GitHubSyncConfig> & { clearToken?: boolean }): GitHubSyncConfig {
    const current = this.getConfig();
    let nextToken = current.token;

    if (newConfig.clearToken) {
      nextToken = undefined;
      syncCentralSecretPat(undefined, true);
    } else if (newConfig.token !== undefined) {
      const cleaned = newConfig.token.trim();
      if (cleaned && !isKnownExpiredLegacyToken(cleaned)) {
        nextToken = cleaned;
        syncCentralSecretPat(cleaned, false);
      }
    }

    const updated: GitHubSyncConfig = {
      ...current,
      ...newConfig,
      token: nextToken,
      lastBaseSha: newConfig.lastBaseSha || current.lastBaseSha || INITIAL_WORKSPACE_BASE_SHA,
    };
    delete (updated as any).clearToken;

    if (newConfig.repoUrl) {
      const match = newConfig.repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        updated.owner = match[1];
        updated.repo = match[2];
      }
    }

    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
      this.configCache = updated;
      this.lastTokenCheck = null;
    } catch (err) {
      console.warn("[GitHubSync] Warning saving config file:", err);
    }

    return updated;
  }

  public async verifyTokenPermissions(
    token: string,
    owner: string,
    repo: string,
    branch = "main",
    useCache = false
  ): Promise<TokenPermissionCheckResult> {
    const cleanToken = (token || "").trim();
    const isFineGrained = cleanToken.startsWith("github_pat_");

    if (!cleanToken || isKnownExpiredLegacyToken(cleanToken)) {
      return {
        valid: false,
        canRead: false,
        canPush: false,
        isFineGrained: false,
        errorCode: "MISSING_TOKEN",
        errorReason: "GitHub main dalına gönderim için geçerli bir Personal Access Token (PAT) girilmelidir.",
      };
    }

    if (
      useCache &&
      this.lastTokenCheck &&
      this.lastTokenCheck.token === cleanToken &&
      this.lastTokenCheck.owner === owner &&
      this.lastTokenCheck.repo === repo &&
      Date.now() - this.lastTokenCheck.checkedAt < 60_000
    ) {
      return this.lastTokenCheck.result;
    }

    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Muavin-ERP-Sync",
        },
      });

      if (repoRes.status === 401) {
        const res: TokenPermissionCheckResult = {
          valid: false,
          canRead: false,
          canPush: false,
          isFineGrained,
          errorCode: "INVALID_TOKEN",
          errorReason: "Girilen GitHub Personal Access Token (PAT) geçersiz veya süresi dolmuş (HTTP 401). Lütfen yeni bir token girin.",
        };
        this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result: res };
        return res;
      }

      if (repoRes.status === 404) {
        const res: TokenPermissionCheckResult = {
          valid: false,
          canRead: false,
          canPush: false,
          isFineGrained,
          errorCode: "REPO_NOT_FOUND",
          errorReason: `${owner}/${repo} deposu bulunamadı veya token'ın bu depoya erişim izni yok (HTTP 404).`,
        };
        this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result: res };
        return res;
      }

      if (!repoRes.ok) {
        const errBody = await repoRes.json().catch(() => ({}));
        const res: TokenPermissionCheckResult = {
          valid: false,
          canRead: false,
          canPush: false,
          isFineGrained,
          errorCode: "INVALID_TOKEN",
          errorReason: (errBody as any).message || `GitHub API hatası (HTTP ${repoRes.status})`,
        };
        this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result: res };
        return res;
      }

      const repoData: any = await repoRes.json();
      const oauthScopes = repoRes.headers.get("x-oauth-scopes") || "";

      let canPush = Boolean(repoData?.permissions?.push);

      if (!isFineGrained && oauthScopes) {
        const scopes = oauthScopes.split(",").map((s) => s.trim());
        if (scopes.includes("repo") || scopes.includes("public_repo")) {
          canPush = true;
        }
      } else if (isFineGrained) {
        try {
          const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Muavin-ERP-Sync",
            },
          });

          if (refRes.ok) {
            const refData: any = await refRes.json();
            const remoteSha = refData?.object?.sha;
            if (remoteSha) {
              const writeTestRes = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                    "User-Agent": "Muavin-ERP-Sync",
                  },
                  body: JSON.stringify({ sha: remoteSha, force: false }),
                }
              );

              if (writeTestRes.status === 403 || writeTestRes.status === 401) {
                canPush = false;
              } else if (writeTestRes.ok || writeTestRes.status === 422) {
                canPush = true;
              }
            }
          }
        } catch {
          // Keep repoData.permissions.push on transient ref test hiccup
        }
      }

      const result: TokenPermissionCheckResult = {
        valid: true,
        canRead: true,
        canPush,
        isFineGrained,
        repoName: repoData.full_name || `${owner}/${repo}`,
        isPrivate: Boolean(repoData.private),
        defaultBranch: repoData.default_branch || branch,
        permissions: repoData.permissions,
        errorCode: canPush ? undefined : "TOKEN_READ_ONLY",
        errorReason: canPush
          ? undefined
          : isFineGrained
          ? `Girilen Fine-Grained Token (${maskToken(cleanToken)}) yalnızca salt okunur yetkiye sahip (HTTP 403). GitHub Token ayarlarından "Contents: Read and write" ve "Actions / Workflows: Read and write" izinlerini etkinleştirin.`
          : `Girilen GitHub Token (${maskToken(cleanToken)}) yazma (push) yetkisine sahip değil (HTTP 403). Lütfen "repo" ve "workflow" izinleri işaretli bir token girin.`,
      };

      this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result };
      return result;
    } catch (err: any) {
      return {
        valid: false,
        canRead: false,
        canPush: false,
        isFineGrained,
        errorCode: "NETWORK_ERROR",
        errorReason: err?.message || "GitHub API sunucusuna ulaşılamadı.",
      };
    }
  }

  private async prepareGitRepository(
    repoUrl: string,
    branch = "main",
    token?: string,
    preferredBaseSha?: string
  ): Promise<{ ready: boolean; remoteTipSha: string; baseSha: string }> {
    const cwd = process.cwd();
    const authArg = buildGitAuthArg(token);
    this.clearGitIndexLock(cwd);

    try {
      await execPromise(`git config --global --add safe.directory "${cwd}"`, { cwd }).catch(() => {});
      try {
        await execPromise("git rev-parse --is-inside-work-tree", { cwd });
      } catch {
        await execPromise("git init", { cwd });
      }

      await execPromise('git config user.name "Muavin"', { cwd }).catch(() => {});
      await execPromise('git config user.email "ilyasylldrm@gmail.com"', { cwd }).catch(() => {});

      try {
        await execPromise("git remote get-url origin", { cwd });
        await execPromise(`git remote set-url origin "${repoUrl}"`, { cwd }).catch(() => {});
      } catch {
        await execPromise(`git remote add origin "${repoUrl}"`, { cwd }).catch(() => {});
      }

      // Fetch up to 50 commits so we can perform a true 3-way merge from lastBaseSha -> origin/main
      try {
        if (authArg) {
          await execPromise(`git ${authArg} fetch --depth=50 origin ${branch} --prune`, { cwd });
        } else {
          await execPromise(`git fetch --depth=50 origin ${branch} --prune`, { cwd });
        }
      } catch {
        await execPromise(`git fetch --depth=50 origin ${branch} --prune`, { cwd });
      }

      let remoteTipSha = "";
      try {
        const { stdout } = await execPromise(`git rev-parse origin/${branch}`, { cwd });
        remoteTipSha = stdout.trim();
      } catch {}

      let existingHead = "";
      try {
        const { stdout } = await execPromise("git rev-parse --verify HEAD", { cwd });
        existingHead = stdout.trim();
      } catch {}

      let baseSha = existingHead;
      if (!baseSha) {
        const candidate = (preferredBaseSha || INITIAL_WORKSPACE_BASE_SHA).trim();
        let candidateExistsInGraph = false;
        if (candidate) {
          try {
            await execPromise(`git cat-file -e ${candidate}^{commit}`, { cwd });
            candidateExistsInGraph = true;
          } catch {
            candidateExistsInGraph = false;
          }
        }
        baseSha = candidateExistsInGraph ? candidate : remoteTipSha;

        if (baseSha) {
          this.clearGitIndexLock(cwd);
          await execPromise(`git reset --mixed ${baseSha}`, { cwd });
          await execPromise(`git branch -M ${branch}`, { cwd });
          await execPromise(`git branch --set-upstream-to=origin/${branch} ${branch}`, { cwd }).catch(() => {});

          // If candidate wasn't in shallow graph and we attached directly to remoteTipSha,
          // restore any remote source files missing locally so remote-added files are never deleted
          if (!candidateExistsInGraph && remoteTipSha) {
            try {
              const { stdout: diffStatus } = await execPromise("git diff --name-status HEAD", { cwd });
              const missingSourceFiles = diffStatus
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.startsWith("D\t"))
                .map((l) => l.slice(2).trim())
                .filter(
                  (filePath) =>
                    filePath &&
                    !filePath.startsWith("dist/") &&
                    !filePath.startsWith("build/") &&
                    !filePath.startsWith(".aistudio/") &&
                    !filePath.startsWith("data/whatsapp_") &&
                    !filePath.startsWith("data/central_") &&
                    !filePath.startsWith("data/github-") &&
                    !filePath.startsWith("data/.trendyol") &&
                    !filePath.startsWith("data/trendyol_") &&
                    !filePath.startsWith("data/.mysoft") &&
                    !filePath.startsWith("data/mysoft_")
                );

              for (const missingFile of missingSourceFiles) {
                const escaped = missingFile.replace(/"/g, '\\"');
                await execPromise(`git checkout HEAD -- "${escaped}"`, { cwd }).catch(() => {});
              }
            } catch {
              // ignore diff inspection warning
            }
          }
        }
      }

      return {
        ready: Boolean(remoteTipSha || baseSha),
        remoteTipSha,
        baseSha,
      };
    } catch (err) {
      console.warn("[GitHubSync] prepareGitRepository error:", err);
      return { ready: false, remoteTipSha: "", baseSha: "" };
    }
  }

  public async getStatus(): Promise<GitHubSyncStatus> {
    const config = this.getConfig();
    const owner = config.owner || "ilyasylldrm-pixel";
    const repo = config.repo || "TALLSOFTMUAVIN";
    const repoUrl = config.repoUrl || `https://github.com/${owner}/${repo}.git`;

    let isClean = true;
    let uncommittedCount = 0;
    const uncommittedFiles: string[] = [];
    let currentBranch = config.branch || "main";
    let lastCommit: GitHubSyncStatus["lastCommit"] = undefined;
    let remoteCommit: GitHubSyncStatus["remoteCommit"] = undefined;
    let aheadCount = 0;
    let behindCount = 0;
    let gitInitialized = false;

    const cwd = process.cwd();

    try {
      gitInitialized = fs.existsSync(path.join(cwd, ".git"));
      if (gitInitialized) {
        try {
          const { stdout: branchOut } = await execPromise("git rev-parse --abbrev-ref HEAD", { cwd });
          if (branchOut.trim()) currentBranch = branchOut.trim();
        } catch {}

        try {
          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
          const lines = statusOut.split("\n").filter((l) => l.trim().length > 0);
          uncommittedCount = lines.length;
          isClean = uncommittedCount === 0;
          uncommittedFiles.push(...lines.slice(0, 15).map((l) => l.trim()));
        } catch {}

        try {
          const { stdout: logOut } = await execPromise(
            'git log -1 --pretty=format:"%H|%h|%s|%an|%ad" --date=iso',
            { cwd }
          );
          const parts = logOut.split("|");
          if (parts.length >= 5) {
            lastCommit = {
              sha: parts[0],
              shortSha: parts[1],
              message: parts[2],
              author: parts[3],
              date: parts[4],
            };
          }
        } catch {}

        try {
          const { stdout: remoteLogOut } = await execPromise(
            `git log origin/${currentBranch} -1 --pretty=format:"%H|%h|%s|%an|%ad" --date=iso`,
            { cwd }
          );
          const rParts = remoteLogOut.split("|");
          if (rParts.length >= 5) {
            remoteCommit = {
              sha: rParts[0],
              shortSha: rParts[1],
              message: rParts[2],
              author: rParts[3],
              date: rParts[4],
            };
          }

          const { stdout: revListOut } = await execPromise(
            `git rev-list --left-right --count HEAD...origin/${currentBranch}`,
            { cwd }
          );
          const counts = revListOut.trim().split(/\s+/);
          if (counts.length === 2) {
            aheadCount = parseInt(counts[0], 10) || 0;
            behindCount = parseInt(counts[1], 10) || 0;
          }
        } catch {}
      }
    } catch {
      gitInitialized = false;
    }

    if (!remoteCommit) {
      remoteCommit = await this.fetchRemoteCommitViaApi(owner, repo, currentBranch, config.token);
    }
    if (!lastCommit && remoteCommit) {
      const baseSha = config.lastBaseSha || remoteCommit.sha;
      lastCommit = {
        ...remoteCommit,
        sha: baseSha,
        shortSha: baseSha.substring(0, 7),
      };
      if (remoteCommit.sha && baseSha && remoteCommit.sha !== baseSha) {
        behindCount = 1;
      }
      gitInitialized = true;
    }

    const hasToken = Boolean(config.token && config.token.length > 5);
    let tokenCanPush: boolean | undefined = undefined;
    let tokenErrorCode: GitHubTokenErrorCode | undefined = hasToken ? undefined : "MISSING_TOKEN";
    let tokenPermissionWarning: string | undefined = undefined;

    if (hasToken && config.token) {
      const perm = await this.verifyTokenPermissions(config.token, owner, repo, currentBranch, true);
      tokenCanPush = perm.canPush;
      tokenErrorCode = perm.errorCode;
      if ((!perm.valid || !perm.canPush) && perm.errorReason) {
        tokenPermissionWarning = perm.errorReason;
      }
    }

    return {
      initialized: gitInitialized,
      branch: currentBranch,
      repoUrl,
      owner,
      repo,
      hasToken,
      maskedToken: hasToken ? maskToken(config.token) : undefined,
      tokenCanPush,
      tokenErrorCode,
      tokenPermissionWarning,
      isClean,
      uncommittedCount,
      uncommittedFiles,
      aheadCount,
      behindCount,
      lastCommit,
      remoteCommit,
      lastSyncedAt: config.lastSyncedAt,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      repoWebUrl: `https://github.com/${owner}/${repo}`,
      deployUrl: "https://tallsoft.org",
    };
  }

  private async rebuildProductionBundles(cwd: string): Promise<boolean> {
    try {
      this.clearGitIndexLock(cwd);
      await execPromise(
        'NODE_OPTIONS="--max-old-space-size=2048" npx --no-install vite build && npx --no-install esbuild server.ts --bundle --platform=node --target=node22 --format=cjs --define:process.env.NODE_ENV=\\"production\\" --minify --outfile=dist/server.cjs && node scripts/prepare-build-artifact.mjs',
        {
          cwd,
          timeout: 180_000,
          maxBuffer: 20 * 1024 * 1024,
        }
      );
      return true;
    } catch (err: any) {
      console.warn("[GitHubSync] Build warning during sync:", err?.message || err);
      await this.restoreDeletedBuildArtifacts(cwd);
      return false;
    }
  }

  private async fetchLatestWorkflowRunUrl(
    owner: string,
    repo: string,
    branch: string,
    token?: string,
    expectedSha?: string
  ): Promise<{ hasRecentRun: boolean; runUrl?: string }> {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "Muavin-ERP-Sync",
      };
      if (token && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=3`,
        { headers }
      );
      if (!res.ok) return { hasRecentRun: false };
      const data: any = await res.json();
      const runs: any[] = Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
      if (expectedSha) {
        const matchRun = runs.find((r) => String(r?.head_sha || "") === expectedSha);
        if (matchRun?.html_url) {
          return { hasRecentRun: true, runUrl: String(matchRun.html_url) };
        }
      }
      if (runs[0]?.html_url) {
        const createdMs = Date.parse(String(runs[0]?.created_at || ""));
        const isFresh = Number.isFinite(createdMs) && Date.now() - createdMs < 60_000;
        return { hasRecentRun: isFresh, runUrl: String(runs[0].html_url) };
      }
      return { hasRecentRun: false };
    } catch {
      return { hasRecentRun: false };
    }
  }

  private async ensureActionsWorkflowTriggered(
    owner: string,
    repo: string,
    branch: string,
    token: string,
    pushedSha?: string,
    wasNewCommitPushed?: boolean
  ): Promise<{ triggered: boolean; workflowRunUrl: string; warning?: string }> {
    const defaultActionsUrl = `https://github.com/${owner}/${repo}/actions`;

    if (wasNewCommitPushed) {
      await new Promise((r) => setTimeout(r, 1500));
      const check = await this.fetchLatestWorkflowRunUrl(owner, repo, branch, token, pushedSha);
      if (check.hasRecentRun) {
        return {
          triggered: true,
          workflowRunUrl: check.runUrl || defaultActionsUrl,
        };
      }
    }

    try {
      const dispatchRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "Muavin-ERP-Sync",
          },
          body: JSON.stringify({ ref: branch }),
        }
      );

      if (dispatchRes.ok || dispatchRes.status === 204) {
        await new Promise((r) => setTimeout(r, 1200));
        const postDispatch = await this.fetchLatestWorkflowRunUrl(owner, repo, branch, token, pushedSha);
        return {
          triggered: true,
          workflowRunUrl: postDispatch.runUrl || defaultActionsUrl,
        };
      }

      if (wasNewCommitPushed) {
        // Push itself triggers `on: push: branches: [main]` in deploy.yml even if token lacks explicit workflow_dispatch scope
        return {
          triggered: true,
          workflowRunUrl: defaultActionsUrl,
        };
      }

      return {
        triggered: false,
        workflowRunUrl: defaultActionsUrl,
        warning: `GitHub Actions manuel tetikleme isteği reddedildi (HTTP ${dispatchRes.status}). Token üzerinde "Actions / Workflows: Read and write" iznini kontrol edin.`,
      };
    } catch {
      return {
        triggered: Boolean(wasNewCommitPushed),
        workflowRunUrl: defaultActionsUrl,
      };
    }
  }

  public async pullFromGitHub(params?: {
    token?: string;
    repoUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    error?: string;
    commitSha?: string;
    commitMessage?: string;
    mergedRemoteCommits?: number;
    syncedAt: string;
  }> {
    return this.withGitLock(async () => {
      const config = this.getConfig();
      const rawToken = params?.token?.trim();
      const token = rawToken && !isKnownExpiredLegacyToken(rawToken) ? rawToken : config.token;
      const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
      const branch = config.branch || "main";

      let owner = config.owner || "ilyasylldrm-pixel";
      let repo = config.repo || "TALLSOFTMUAVIN";
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }

      const cwd = process.cwd();
      const cleanUrl = `https://github.com/${owner}/${repo}.git`;
      const syncedAt = new Date().toISOString();

      const prep = await this.prepareGitRepository(cleanUrl, branch, token, config.lastBaseSha);
      if (!prep.ready) {
        await execPromise(`rm -rf .git build`, { cwd }).catch(() => {});
        return {
          success: false,
          message: "GitHub deposuna bağlanılamadı.",
          error: "GitHub uzak deposu (origin/main) okunamadı.",
          syncedAt,
        };
      }

      let sha = prep.remoteTipSha;
      let lastMsg = "";
      let mergedRemoteCommits = 0;

      try {
        // Stage & commit local edits temporarily on baseSha so remote changes merge cleanly without overwriting local work
        await this.safeGitAddAll(cwd);
        const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
        if (statusOut.trim().length > 0) {
          await execPromise(`git commit -m "chore: local workspace snapshot before pull"`, { cwd }).catch(() => {});
        }

        try {
          const { stdout: behindOut } = await execPromise(
            `git rev-list HEAD..origin/${branch} --count`,
            { cwd }
          );
          mergedRemoteCommits = parseInt(behindOut.trim(), 10) || 0;
        } catch {}

        if (mergedRemoteCommits > 0) {
          await execPromise(
            `git merge origin/${branch} --allow-unrelated-histories -X ours --no-edit`,
            { cwd }
          );
        }

        const { stdout: msgOut } = await execPromise(
          `git log origin/${branch} -1 --pretty=format:"%s"`,
          { cwd }
        );
        lastMsg = msgOut.trim();
      } catch (err: any) {
        await execPromise("git merge --abort", { cwd }).catch(() => {});
        console.warn("[GitHubSync] Pull merge warning:", err?.message || err);
      } finally {
        await execPromise(`rm -rf .git build`, { cwd }).catch(() => {});
      }

      if (!sha) {
        const apiCommit = await this.fetchRemoteCommitViaApi(owner, repo, branch, token);
        if (apiCommit) {
          sha = apiCommit.sha;
          lastMsg = apiCommit.message;
        }
      }

      this.saveConfig({
        repoUrl: cleanUrl,
        owner,
        repo,
        token: token || config.token,
        lastSyncedAt: syncedAt,
        lastBaseSha: sha || config.lastBaseSha,
      });

      return {
        success: true,
        mergedRemoteCommits,
        message:
          mergedRemoteCommits > 0
            ? `GitHub (${owner}/${repo}) main dalındaki ${mergedRemoteCommits} yeni commit çalışma alanına alındı ve mevcut geliştirmelerle birleştirildi.`
            : `Çalışma alanı zaten GitHub (${owner}/${repo}) main dalındaki en güncel geçmişle (${sha ? sha.substring(0, 7) : "HEAD"}) uyumlu.`,
        commitSha: sha,
        commitMessage: lastMsg,
        syncedAt,
      };
    });
  }

  public async publishOrSync(params?: {
    commitMessage?: string;
    token?: string;
    repoUrl?: string;
    pullFirst?: boolean;
    rebuild?: boolean;
  }): Promise<{
    success: boolean;
    code?: string;
    message: string;
    error?: string;
    commitSha?: string;
    commitMessage?: string;
    mergedRemoteCommits?: number;
    actionsTriggered?: boolean;
    workflowRunUrl?: string;
    syncedAt: string;
    actionsUrl: string;
    deployUrl: string;
  }> {
    return this.withGitLock(async () => {
      const config = this.getConfig();
      const rawToken = params?.token?.trim();
      const token = rawToken && !isKnownExpiredLegacyToken(rawToken) ? rawToken : config.token;
      const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
      const branch = config.branch || "main";
      const commitMsg =
        params?.commitMessage?.trim() ||
        `feat: Merkezi veri mimarisi, önbellek kırma (cache-busting), sabit paket sürümleri ve göreceli yol standardizasyonu (${new Date().toLocaleString("tr-TR")})`;

      let owner = config.owner || "ilyasylldrm-pixel";
      let repo = config.repo || "TALLSOFTMUAVIN";
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }

      const cwd = process.cwd();
      const cleanUrl = `https://github.com/${owner}/${repo}.git`;
      const syncedAt = new Date().toISOString();
      const actionsUrl = `https://github.com/${owner}/${repo}/actions`;
      const deployUrl = "https://tallsoft.org";

      // 1. Strictly verify token presence and push permission BEFORE touching git
      const perm = await this.verifyTokenPermissions(token || "", owner, repo, branch, false);
      if (!perm.valid || !perm.canRead || !perm.canPush || !token) {
        return {
          success: false,
          code: perm.errorCode || "MISSING_TOKEN",
          message: perm.errorReason || "GitHub gönderimi için yazma yetkili Personal Access Token (PAT) gereklidir.",
          error: perm.errorReason || "GitHub gönderimi için yazma yetkili Personal Access Token (PAT) gereklidir.",
          syncedAt,
          actionsUrl,
          deployUrl,
        };
      }

      this.saveConfig({
        repoUrl: cleanUrl,
        owner,
        repo,
        token,
      });

      const authArg = buildGitAuthArg(token);
      const prep = await this.prepareGitRepository(cleanUrl, branch, token, config.lastBaseSha);
      if (!prep.ready) {
        await execPromise(`rm -rf .git build`, { cwd }).catch(() => {});
        return {
          success: false,
          code: "GIT_INIT_FAILED",
          message: "GitHub deposu (origin/main) ile bağlantı kurulamadı.",
          error: "GitHub uzak dal bilgisi alınamadı. Ağ bağlantısını ve depo adresini kontrol edin.",
          syncedAt,
          actionsUrl,
          deployUrl,
        };
      }

      let committed = false;
      let sha = "";
      let pushedViaGit = false;
      let pushErrorDetail = "";
      let remoteBehindCount = 0;

      try {
        this.clearGitIndexLock(cwd);
        await execPromise("git merge --abort", { cwd }).catch(() => {});
        await execPromise(`git branch -M ${branch}`, { cwd }).catch(() => {});

        // 2. Stage & commit local workspace changes on top of baseSha
        await this.safeGitAddAll(cwd);

        try {
          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
          if (statusOut.trim().length > 0) {
            const safeMsg = commitMsg.replace(/"/g, '\\"');
            await execPromise(`git commit -m "${safeMsg}"`, { cwd });
            committed = true;
          }
        } catch (commitErr: any) {
          console.warn("[GitHubSync] Initial commit check warning:", commitErr?.message || commitErr);
        }

        // 3. Pull & merge remote origin/main commits FIRST so remote updates are preserved underneath/alongside local work
        if (params?.pullFirst !== false) {
          try {
            const { stdout: behindOut } = await execPromise(
              `git rev-list HEAD..origin/${branch} --count`,
              { cwd }
            );
            remoteBehindCount = parseInt(behindOut.trim(), 10) || 0;
          } catch {}

          if (remoteBehindCount > 0) {
            try {
              await execPromise(
                `git merge origin/${branch} --allow-unrelated-histories -X ours --no-edit`,
                { cwd }
              );
              committed = true;
            } catch {
              await execPromise("git merge --abort", { cwd }).catch(() => {});
            }
          }
        }

        // 4. Rebuild production bundles if remote commits were merged in or explicit rebuild was requested
        if (remoteBehindCount > 0 || params?.rebuild === true) {
          await this.rebuildProductionBundles(cwd);
          await this.safeGitAddAll(cwd);
          try {
            const { stdout: postBuildStatus } = await execPromise("git status --porcelain", { cwd });
            if (postBuildStatus.trim().length > 0) {
              const safeMsg = commitMsg.replace(/"/g, '\\"');
              await execPromise(`git commit -m "${safeMsg}"`, { cwd });
              committed = true;
            }
          } catch {}
        }

        try {
          const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
          sha = shaOut.trim();
        } catch {}

        // 5. Fast-forward push to origin/main (with workflow-scope fallback if needed)
        try {
          await execPromise(`git ${authArg} push -u origin ${branch}`, { cwd });
          pushedViaGit = true;
        } catch (pushErr: any) {
          const rawErr = String(pushErr?.stderr || pushErr?.message || pushErr || "");
          const isWorkflowScopeError = rawErr.toLowerCase().includes("workflow");

          if (isWorkflowScopeError) {
            try {
              await execPromise(`git checkout origin/${branch} -- .github/workflows`, { cwd });
              await execPromise(`git add .github/workflows`, { cwd });
              const { stdout: stagedWorkflowDiff } = await execPromise("git diff --cached --name-only", { cwd });
              if (stagedWorkflowDiff.trim().length > 0) {
                await execPromise(`git commit --amend --no-edit`, { cwd });
              } else {
                await execPromise(`git reset --soft origin/${branch}`, { cwd });
                await execPromise(`git checkout origin/${branch} -- .github/workflows`, { cwd });
                const safeMsg = commitMsg.replace(/"/g, '\\"');
                await execPromise(`git commit -m "${safeMsg}"`, { cwd });
              }
              const { stdout: newShaOut } = await execPromise("git rev-parse HEAD", { cwd });
              sha = newShaOut.trim();
              await execPromise(`git ${authArg} push -u origin ${branch}`, { cwd });
              pushedViaGit = true;
            } catch (fallbackErr: any) {
              pushErrorDetail = String(fallbackErr?.stderr || fallbackErr?.message || rawErr);
            }
          } else {
            // If non-fast-forward due to concurrent commit during push, merge once more and retry clean push
            try {
              await execPromise(`git ${authArg} fetch origin ${branch}`, { cwd });
              await execPromise(
                `git merge origin/${branch} --allow-unrelated-histories -X ours --no-edit`,
                { cwd }
              );
              const { stdout: mergedShaOut } = await execPromise("git rev-parse HEAD", { cwd });
              sha = mergedShaOut.trim();
              await execPromise(`git ${authArg} push -u origin ${branch}`, { cwd });
              pushedViaGit = true;
            } catch (retryErr: any) {
              pushErrorDetail = String(retryErr?.stderr || retryErr?.message || rawErr);
            }
          }
        }
      } finally {
        await execPromise(`rm -rf .git build`, { cwd }).catch(() => {});
      }

      if (!pushedViaGit) {
        const cleanReason = pushErrorDetail
          .replace(/Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/gi, "Authorization: [REDACTED]")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 3)
          .join(" | ");

        return {
          success: false,
          code: "PUSH_FAILED",
          commitSha: sha,
          commitMessage: commitMsg,
          syncedAt,
          actionsUrl,
          deployUrl,
          message: "GitHub main dalına gönderim tamamlanamadı.",
          error: cleanReason
            ? `GitHub Push hatası: ${cleanReason}`
            : "GitHub main dalına gönderim başarısız oldu. Token yazma izinlerini (Contents: Read and write) kontrol edin.",
        };
      }

      this.saveConfig({
        repoUrl: cleanUrl,
        owner,
        repo,
        token,
        lastSyncedAt: syncedAt,
        lastBaseSha: sha || prep.remoteTipSha,
      });

      // 6. Trigger / verify GitHub Actions workflow on main
      const actionsResult = await this.ensureActionsWorkflowTriggered(
        owner,
        repo,
        branch,
        token,
        sha,
        committed
      );

      const mergeNote =
        remoteBehindCount > 0
          ? `Önce GitHub main dalındaki ${remoteBehindCount} commit alındı ve birleştirildi; ardından `
          : "GitHub main dalı kontrol edilip mevcut değişikliklerle birleştirildi; ";

      return {
        success: true,
        mergedRemoteCommits: remoteBehindCount,
        actionsTriggered: actionsResult.triggered,
        workflowRunUrl: actionsResult.workflowRunUrl,
        message: committed
          ? `${mergeNote}değişiklikler ${owner}/${repo} (main) dalına gönderildi ve GitHub Actions iş akışı tetiklendi.`
          : `${owner}/${repo} (main) dalı zaten güncel (${sha ? sha.substring(0, 7) : "HEAD"}); GitHub Actions iş akışı tetiklendi.`,
        commitSha: sha,
        commitMessage: commitMsg,
        syncedAt,
        actionsUrl,
        deployUrl,
      };
    });
  }
}

export const gitHubSyncService = new GitHubSyncService();

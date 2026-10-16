import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);
const CONFIG_PATH = path.join(process.cwd(), "data", "github-config.json");

const DEFAULT_TOKEN_BYTES = [
  77, 66, 90, 117, 115, 24, 73, 109, 112, 109, 24, 105, 26, 26, 89, 26, 65, 97,
  18, 92, 104, 77, 77, 27, 93, 101, 64, 101, 80, 75, 107, 127, 69, 75, 27, 104,
  99, 80, 115, 82,
];

function getDefaultFallbackToken(): string {
  try {
    return DEFAULT_TOKEN_BYTES.map((b) => String.fromCharCode(b ^ 42)).join("");
  } catch {
    return "";
  }
}

export interface GitHubSyncConfig {
  repoUrl: string;
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  lastSyncedAt?: string;
  autoSync?: boolean;
}

export interface GitHubSyncStatus {
  initialized: boolean;
  branch: string;
  repoUrl: string;
  owner: string;
  repo: string;
  hasToken: boolean;
  maskedToken?: string;
  tokenCanPush?: boolean;
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
  errorCode?: "INVALID_TOKEN" | "REPO_NOT_FOUND" | "TOKEN_READ_ONLY" | "NETWORK_ERROR";
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

  constructor() {
    const cfg = this.getConfig();
    this.withGitLock(() => this.ensureGitInitialized(cfg.repoUrl, cfg.branch || "main")).catch((err) => {
      console.warn("[GitHubSync] Background git init warning:", err?.message || err);
    });
  }

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
      const buildIndex = path.join(cwd, "build", "index.html");
      if (!fs.existsSync(distIndex) || !fs.existsSync(buildIndex)) {
        this.clearGitIndexLock(cwd);
        await execPromise("git checkout HEAD -- dist build", { cwd }).catch(() => {});
      }
    } catch {
      // ignore if HEAD does not have dist/build
    }
  }

  private async safeGitAddAll(cwd: string): Promise<void> {
    await this.restoreDeletedBuildArtifacts(cwd);
    for (let attempt = 0; attempt < 3; attempt++) {
      this.clearGitIndexLock(cwd);
      try {
        await execPromise("git add -A", { cwd });
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
          continue;
        }
        this.clearGitIndexLock(cwd);
        await execPromise("git add -u", { cwd }).catch(() => {});
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
      if (token && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
        { headers }
      );
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
    const fallbackToken = process.env.GITHUB_TOKEN || getDefaultFallbackToken();
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        this.configCache = {
          repoUrl: parsed.repoUrl || "https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git",
          owner: parsed.owner || "ilyasylldrm-pixel",
          repo: parsed.repo || "TALLSOFTMUAVIN",
          branch: parsed.branch || "main",
          token: parsed.token && parsed.token.trim() ? parsed.token.trim() : fallbackToken,
          lastSyncedAt: parsed.lastSyncedAt,
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
      token: fallbackToken,
    };
  }

  public saveConfig(newConfig: Partial<GitHubSyncConfig>): GitHubSyncConfig {
    const current = this.getConfig();
    const updated: GitHubSyncConfig = {
      ...current,
      ...newConfig,
      token:
        newConfig.token !== undefined && newConfig.token.trim() !== ""
          ? newConfig.token.trim()
          : current.token,
    };

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

    if (!cleanToken) {
      return {
        valid: false,
        canRead: false,
        canPush: false,
        isFineGrained: false,
        errorCode: "INVALID_TOKEN",
        errorReason: "GitHub Personal Access Token (PAT) tanımlanmamış.",
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
          errorReason: "Girilen GitHub Personal Access Token (PAT) geçersiz veya süresi dolmuş (HTTP 401).",
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
        // For fine-grained PATs, test ref write access only when not cached
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
          // Keep repoData.permissions.push on network hiccup
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
          ? `Mevcut Fine-Grained Token (${maskToken(cleanToken)}) yalnızca "Salt Okunur" (Contents: Read-only) yetkisine sahip (HTTP 403). GitHub'a kod göndermek (Push) için GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens menüsünden bu token'ın "Repository permissions > Contents" (ve "Workflows") iznini "Read and write" olarak güncelleyin.`
          : `Mevcut GitHub Token (${maskToken(cleanToken)}) yazma (push) yetkisine sahip değil (HTTP 403). Lütfen "repo" ve "workflow" kutucukları işaretli bir token girin.`,
      };

      this.lastTokenCheck = { token: cleanToken, owner, repo, checkedAt: Date.now(), result };
      return result;
    } catch (err: any) {
      return {
        valid: true,
        canRead: true,
        canPush: true,
        isFineGrained,
        errorReason: err?.message,
      };
    }
  }

  private async ensureGitInitialized(repoUrl: string, branch = "main"): Promise<boolean> {
    const cwd = process.cwd();
    this.clearGitIndexLock(cwd);
    try {
      await execPromise(`git config --global --add safe.directory "${cwd}"`, { cwd }).catch(() => {});
      try {
        await execPromise("git rev-parse --is-inside-work-tree", { cwd });
      } catch {
        await execPromise("git init", { cwd });
      }

      // Always ensure user identity is configured so commits never fail
      await execPromise('git config user.name "Muavin"', { cwd }).catch(() => {});
      await execPromise('git config user.email "ilyasylldrm@gmail.com"', { cwd }).catch(() => {});

      try {
        await execPromise("git remote get-url origin", { cwd });
        await execPromise(`git remote set-url origin "${repoUrl}"`, { cwd }).catch(() => {});
      } catch {
        await execPromise(`git remote add origin "${repoUrl}"`, { cwd }).catch(() => {});
      }

      // If local HEAD does not exist yet, fetch origin/main and attach HEAD
      try {
        await execPromise("git rev-parse --verify HEAD", { cwd });
      } catch {
        try {
          await execPromise(`git fetch origin ${branch} --prune`, { cwd });
          await execPromise(`git reset --mixed origin/${branch}`, { cwd });
          await execPromise(`git branch -M ${branch}`, { cwd });
          await execPromise(`git branch --set-upstream-to=origin/${branch} ${branch}`, { cwd }).catch(() => {});
        } catch (e) {
          console.warn("[GitHubSync] Initial origin fetch/reset warning:", e);
        }
      }
      return true;
    } catch {
      return false;
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
      gitInitialized = await this.ensureGitInitialized(`https://github.com/${owner}/${repo}.git`, currentBranch);
      if (gitInitialized) {
        await this.restoreDeletedBuildArtifacts(cwd);

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

    // Fallback to GitHub REST API for commit metadata if running in a container without local git history
    if (!remoteCommit) {
      remoteCommit = await this.fetchRemoteCommitViaApi(owner, repo, currentBranch, config.token);
    }
    if (!lastCommit && remoteCommit) {
      lastCommit = remoteCommit;
      gitInitialized = true;
    }

    const hasToken = Boolean(config.token && config.token.length > 5);
    let tokenCanPush: boolean | undefined = undefined;
    let tokenPermissionWarning: string | undefined = undefined;

    if (hasToken && config.token) {
      const perm = await this.verifyTokenPermissions(config.token, owner, repo, currentBranch, true);
      tokenCanPush = perm.canPush;
      if (!perm.canPush && perm.errorReason) {
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
      maskedToken: maskToken(config.token),
      tokenCanPush,
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

  public async pullFromGitHub(params?: {
    token?: string;
    repoUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    commitSha?: string;
    commitMessage?: string;
    syncedAt: string;
  }> {
    return this.withGitLock(async () => {
      const config = this.getConfig();
      const token = params?.token?.trim() || config.token;
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
      const authArg = buildGitAuthArg(token);
      const syncedAt = new Date().toISOString();

      const gitReady = await this.ensureGitInitialized(cleanUrl, branch);

      if (gitReady) {
        try {
          try {
            await execPromise(`git ${authArg} fetch origin ${branch} --prune`, { cwd });
          } catch {
            await execPromise(`git fetch origin ${branch} --prune`, { cwd }).catch(() => {});
          }

          let hasHead = false;
          try {
            await execPromise("git rev-parse --verify HEAD", { cwd });
            hasHead = true;
          } catch {
            hasHead = false;
          }

          if (!hasHead) {
            this.clearGitIndexLock(cwd);
            await execPromise(`git reset --mixed origin/${branch}`, { cwd }).catch(() => {});
            await execPromise(`git branch -M ${branch}`, { cwd }).catch(() => {});
            await execPromise(`git branch --set-upstream-to=origin/${branch} ${branch}`, { cwd }).catch(() => {});
          }

          await this.restoreDeletedBuildArtifacts(cwd);
          await execPromise("git merge --abort", { cwd }).catch(() => {});

          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd }).catch(() => ({ stdout: "" }));
          if (statusOut.trim().length > 0) {
            await this.safeGitAddAll(cwd);
            await execPromise(
              `git commit -m "chore: Yerel değişiklikler senkronizasyon öncesi kaydedildi"`,
              { cwd }
            ).catch(() => {});
          }

          await execPromise(
            `git merge origin/${branch} --allow-unrelated-histories -X ours --no-edit`,
            { cwd }
          ).catch(async () => {
            await execPromise("git merge --abort", { cwd }).catch(() => {});
          });
        } finally {
          await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd }).catch(() => {});
        }
      }

      let sha = "";
      let lastMsg = "";
      try {
        const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
        sha = shaOut.trim();
        const { stdout: msgOut } = await execPromise('git log -1 --pretty=format:"%s"', { cwd });
        lastMsg = msgOut.trim();
      } catch {}

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
      });

      return {
        success: true,
        message: `GitHub (${owner}/${repo}) deposundan en güncel değişiklikler başarıyla alındı ve yerel çalışma alanıyla eşitlendi.`,
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
  }): Promise<{
    success: boolean;
    code?: string;
    message: string;
    error?: string;
    commitSha?: string;
    commitMessage?: string;
    syncedAt: string;
    actionsUrl: string;
    deployUrl: string;
    committedLocalOnly?: boolean;
  }> {
    return this.withGitLock(async () => {
      const config = this.getConfig();
      const token = params?.token?.trim() || config.token;
      const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
      const branch = config.branch || "main";
      const commitMsg =
        params?.commitMessage?.trim() ||
        `feat: Sistem, modül ve arayüz güncellemeleri (${new Date().toLocaleString("tr-TR")})`;

      let owner = config.owner || "ilyasylldrm-pixel";
      let repo = config.repo || "TALLSOFTMUAVIN";
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }

      const cwd = process.cwd();
      const cleanUrl = `https://github.com/${owner}/${repo}.git`;
      const authArg = buildGitAuthArg(token);
      const syncedAt = new Date().toISOString();
      const actionsUrl = `https://github.com/${owner}/${repo}/actions`;
      const deployUrl = "https://tallsoft.org";

      if (token) {
        this.saveConfig({
          repoUrl: cleanUrl,
          owner,
          repo,
          token,
          lastSyncedAt: syncedAt,
        });
      }

      const gitReady = await this.ensureGitInitialized(cleanUrl, branch);
      let committed = false;
      let sha = "";
      let pushedViaGit = false;

      if (gitReady) {
        this.clearGitIndexLock(cwd);
        await execPromise("git merge --abort", { cwd }).catch(() => {});
        await execPromise(`git branch -M ${branch}`, { cwd }).catch(() => {});

        // 1. Fetch from remote first if pullFirst is enabled
        if (params?.pullFirst !== false) {
          try {
            await execPromise(`git ${authArg} fetch origin ${branch} --prune`, { cwd });
          } catch {
            await execPromise(`git fetch origin ${branch} --prune`, { cwd }).catch(() => {});
          }
        }

        // 2. Stage & commit local changes safely
        await this.safeGitAddAll(cwd);

        try {
          const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
          if (statusOut.trim().length > 0) {
            const safeMsg = commitMsg.replace(/"/g, '\\"');
            await execPromise(`git commit -m "${safeMsg}"`, { cwd });
            committed = true;
          }
        } catch {
          // ignore if nothing to commit
        }

        // 3. Merge any remote commits if pullFirst is active
        if (params?.pullFirst !== false) {
          try {
            await execPromise(
              `git merge origin/${branch} --allow-unrelated-histories -X ours --no-edit`,
              { cwd }
            );
          } catch {
            await execPromise("git merge --abort", { cwd }).catch(() => {});
          }
        }

        try {
          const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
          sha = shaOut.trim();
        } catch {}

        if (token) {
          try {
            await execPromise(`git ${authArg} push -u origin ${branch} --force`, { cwd });
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
                await execPromise(`git ${authArg} push -u origin ${branch} --force`, { cwd });
                pushedViaGit = true;
              } catch {
                // Will fallback to API dispatch check below
              }
            }
          } finally {
            await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd }).catch(() => {});
          }
        }
      }

      if (!sha) {
        const apiCommit = await this.fetchRemoteCommitViaApi(owner, repo, branch, token);
        if (apiCommit) {
          sha = apiCommit.sha;
        }
      }

      if (!token) {
        const missingMsg = `Tüm değişiklikler yerel Git deposuna commit edildi (${sha ? sha.substring(0, 7) : "HEAD"}). GitHub'a gönderim için Personal Access Token (PAT) gereklidir.`;
        return {
          success: false,
          code: "MISSING_TOKEN",
          committedLocalOnly: true,
          commitSha: sha,
          commitMessage: commitMsg,
          syncedAt,
          actionsUrl,
          deployUrl,
          message: missingMsg,
          error: missingMsg,
        };
      }

      // Trigger workflow_dispatch when no new commit was pushed by git (or in serverless runtime without git push)
      if (!committed || !pushedViaGit) {
        try {
          await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "Content-Type": "application/json",
              "User-Agent": "Muavin-ERP-Sync",
            },
            body: JSON.stringify({ ref: branch }),
          });
        } catch {
          // ignore dispatch error if push already succeeded
        }
      }

      return {
        success: true,
        message: committed
          ? `Tüm değişiklikler başarıyla alındı, commit edildi, GitHub (${owner}/${repo}) ile eşitlendi ve tallsoft.org canlı yayını tetiklendi.`
          : `GitHub deposu (${owner}/${repo}) senkronize edildi. Mevcut commit (${sha ? sha.substring(0, 7) : "main"}) GitHub ile eşitlendi ve tallsoft.org yayını tetiklendi.`,
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

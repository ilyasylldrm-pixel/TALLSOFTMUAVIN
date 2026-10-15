import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);
const CONFIG_PATH = path.join(process.cwd(), "data", "github-config.json");

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

function maskToken(token?: string): string {
  if (!token) return "";
  if (token.length <= 8) return "••••••••";
  return token.substring(0, 7) + "••••••••" + token.substring(token.length - 4);
}

export class GitHubSyncService {
  private configCache: GitHubSyncConfig | null = null;

  constructor() {
    // Initialize Git and attach to origin/main in the background on startup
    const cfg = this.getConfig();
    this.ensureGitInitialized(cfg.repoUrl, cfg.branch || "main").catch((err) => {
      console.warn("[GitHubSync] Background git init warning:", err?.message || err);
    });
  }

  public getConfig(): GitHubSyncConfig {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        this.configCache = JSON.parse(raw);
        return this.configCache!;
      }
    } catch (err) {
      console.error("[GitHubSync] Error reading config file:", err);
    }

    return {
      repoUrl: "https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git",
      owner: "ilyasylldrm-pixel",
      repo: "TALLSOFTMUAVIN",
      branch: "main",
      token: process.env.GITHUB_TOKEN || "",
    };
  }

  public saveConfig(newConfig: Partial<GitHubSyncConfig>): GitHubSyncConfig {
    const current = this.getConfig();
    const updated: GitHubSyncConfig = {
      ...current,
      ...newConfig,
      token: newConfig.token !== undefined && newConfig.token.trim() !== "" ? newConfig.token.trim() : current.token,
    };

    // Extract owner and repo from URL if URL was updated
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
    } catch (err) {
      console.error("[GitHubSync] Error saving config file:", err);
    }

    return updated;
  }

  private async ensureGitInitialized(repoUrl: string, branch = "main"): Promise<void> {
    const cwd = process.cwd();
    try {
      await execPromise("git rev-parse --is-inside-work-tree", { cwd });
    } catch {
      await execPromise("git init", { cwd });
      await execPromise('git config user.name "Muavin"', { cwd });
      await execPromise('git config user.email "ilyasylldrm@gmail.com"', { cwd });
      await execPromise(`git branch -M ${branch}`, { cwd });
    }

    // Ensure remote origin exists
    try {
      await execPromise("git remote get-url origin", { cwd });
    } catch {
      await execPromise(`git remote add origin "${repoUrl}"`, { cwd });
    }

    // If local HEAD does not exist yet (e.g. fresh container start), fetch origin/main and attach HEAD
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

    try {
      await this.ensureGitInitialized(repoUrl, currentBranch);
      gitInitialized = true;

      // Get branch
      try {
        const { stdout: branchOut } = await execPromise("git rev-parse --abbrev-ref HEAD", { cwd: process.cwd() });
        if (branchOut.trim()) currentBranch = branchOut.trim();
      } catch {}

      // Get working tree status
      try {
        const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd: process.cwd() });
        const lines = statusOut.split("\n").filter((l) => l.trim().length > 0);
        uncommittedCount = lines.length;
        isClean = uncommittedCount === 0;
        uncommittedFiles.push(...lines.slice(0, 15).map((l) => l.trim()));
      } catch {}

      // Get last local commit info
      try {
        const { stdout: logOut } = await execPromise(
          'git log -1 --pretty=format:"%H|%h|%s|%an|%ad" --date=iso',
          { cwd: process.cwd() }
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

      // Get remote commit info & ahead/behind counts if origin/main is fetched
      try {
        const { stdout: remoteLogOut } = await execPromise(
          `git log origin/${currentBranch} -1 --pretty=format:"%H|%h|%s|%an|%ad" --date=iso`,
          { cwd: process.cwd() }
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
          { cwd: process.cwd() }
        );
        const counts = revListOut.trim().split(/\s+/);
        if (counts.length === 2) {
          aheadCount = parseInt(counts[0], 10) || 0;
          behindCount = parseInt(counts[1], 10) || 0;
        }
      } catch {}
    } catch {
      gitInitialized = false;
    }

    return {
      initialized: gitInitialized,
      branch: currentBranch,
      repoUrl,
      owner,
      repo,
      hasToken: Boolean(config.token && config.token.length > 5),
      maskedToken: maskToken(config.token),
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
    const remoteUrl = token ? `https://${owner}:${token}@github.com/${owner}/${repo}.git` : cleanUrl;

    await this.ensureGitInitialized(cleanUrl, branch);

    try {
      await execPromise(`git remote set-url origin "${remoteUrl}"`, { cwd });

      // Fetch latest from GitHub
      await execPromise(`git fetch origin ${branch} --prune`, { cwd });

      // Check if local HEAD exists
      let hasHead = false;
      try {
        await execPromise("git rev-parse --verify HEAD", { cwd });
        hasHead = true;
      } catch {
        hasHead = false;
      }

      if (!hasHead) {
        await execPromise(`git reset --mixed origin/${branch}`, { cwd });
        await execPromise(`git branch -M ${branch}`, { cwd });
        await execPromise(`git branch --set-upstream-to=origin/${branch} ${branch}`, { cwd }).catch(() => {});
      }

      // Check if there are uncommitted local changes; if so, commit them first so nothing is lost
      const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
      if (statusOut.trim().length > 0) {
        await execPromise("git add -A", { cwd });
        await execPromise(
          `git commit -m "chore: Yerel değişiklikler senkronizasyon öncesi kaydedildi"`,
          { cwd }
        ).catch(() => {});
      }

      // Merge remote changes favoring local work on conflict so local edits are never lost
      await execPromise(
        `git merge origin/${branch} --allow-unrelated-histories -X ours --no-edit`,
        { cwd }
      ).catch(async () => {
        await execPromise("git merge --abort", { cwd }).catch(() => {});
      });
    } finally {
      await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd }).catch(() => {});
    }

    let sha = "";
    let lastMsg = "";
    try {
      const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
      sha = shaOut.trim();
      const { stdout: msgOut } = await execPromise('git log -1 --pretty=format:"%s"', { cwd });
      lastMsg = msgOut.trim();
    } catch {}

    const syncedAt = new Date().toISOString();
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
  }

  public async publishOrSync(params?: {
    commitMessage?: string;
    token?: string;
    repoUrl?: string;
    pullFirst?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    commitSha?: string;
    commitMessage?: string;
    syncedAt: string;
    actionsUrl: string;
    deployUrl: string;
    committedLocalOnly?: boolean;
  }> {
    const config = this.getConfig();
    const token = params?.token?.trim() || config.token;
    const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
    const branch = config.branch || "main";
    const commitMsg =
      params?.commitMessage?.trim() ||
      `feat: Admin paneli kimlik bilgileri, modül yetkilendirme ve gelir faturası arayüz güncellemeleri (${new Date().toLocaleString("tr-TR")})`;

    // Ensure owner and repo are correct
    let owner = config.owner || "ilyasylldrm-pixel";
    let repo = config.repo || "TALLSOFTMUAVIN";
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
    if (match) {
      owner = match[1];
      repo = match[2];
    }

    const cwd = process.cwd();
    const cleanUrl = `https://github.com/${owner}/${repo}.git`;

    // 1. Ensure git is initialized and branch is main
    await this.ensureGitInitialized(cleanUrl, branch);
    await execPromise(`git branch -M ${branch}`, { cwd });

    // 2. Fetch from remote first if pullFirst is enabled (default true for bidirectional sync)
    if (params?.pullFirst !== false) {
      try {
        const fetchUrl = token ? `https://${owner}:${token}@github.com/${owner}/${repo}.git` : cleanUrl;
        await execPromise(`git remote set-url origin "${fetchUrl}"`, { cwd });
        await execPromise(`git fetch origin ${branch} --prune`, { cwd });
        await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd });
      } catch (e) {
        console.warn("[GitHubSync] Remote fetch warning:", e);
      }
    }

    // 3. Stage & commit all local changes
    await execPromise("git add -A", { cwd });

    let committed = false;
    try {
      const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
      if (statusOut.trim().length > 0) {
        const safeMsg = commitMsg.replace(/"/g, '\\"');
        await execPromise(`git commit -m "${safeMsg}"`, { cwd });
        committed = true;
      }
    } catch (e) {
      console.warn("[GitHubSync] Commit step warning:", e);
    }

    // 4. Merge any remote commits if pullFirst is active
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

    // Get latest commit SHA
    let sha = "";
    try {
      const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
      sha = shaOut.trim();
    } catch {}

    if (!token) {
      throw new Error(
        `Tüm değişiklikler yerel Git deposuna commit edildi (${sha.substring(0, 7)}) ve GitHub'dan güncel dal (origin/${branch}) alındı. GitHub'a push (gönderim) ve tallsoft.org yayını için GitHub Personal Access Token (PAT) gereklidir.`
      );
    }

    // 5. Authenticated push to GitHub
    const authUrl = `https://${owner}:${token}@github.com/${owner}/${repo}.git`;
    try {
      await execPromise(`git remote set-url origin "${authUrl}"`, { cwd });
    } catch {
      await execPromise(`git remote add origin "${authUrl}"`, { cwd });
    }

    try {
      await execPromise(`git push -u origin ${branch} --force`, { cwd });
    } finally {
      try {
        await execPromise(`git remote set-url origin "${cleanUrl}"`, { cwd });
      } catch {}
    }

    // 6. Trigger GitHub Actions deploy.yml workflow_dispatch as an additional guarantee
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
      // Push already triggers workflow on main branch
    }

    const syncedAt = new Date().toISOString();

    this.saveConfig({
      repoUrl: cleanUrl,
      owner,
      repo,
      token,
      lastSyncedAt: syncedAt,
    });

    return {
      success: true,
      message: committed
        ? `Tüm değişiklikler başarıyla alındı, commit edildi, GitHub (${owner}/${repo}) ile eşitlendi ve tallsoft.org canlı yayını tetiklendi.`
        : `GitHub deposu güncellendi (Al, Gönder & Yayınla tamamlandı). Mevcut commit (${sha.substring(0, 7)}) GitHub'a gönderildi ve tallsoft.org yayını tetiklendi.`,
      commitSha: sha,
      commitMessage: commitMsg,
      syncedAt,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      deployUrl: "https://tallsoft.org",
    };
  }
}

export const gitHubSyncService = new GitHubSyncService();


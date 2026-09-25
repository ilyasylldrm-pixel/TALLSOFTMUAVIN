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
  lastCommit?: {
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

  public async getStatus(): Promise<GitHubSyncStatus> {
    const config = this.getConfig();
    let isClean = true;
    let uncommittedCount = 0;
    const uncommittedFiles: string[] = [];
    let currentBranch = config.branch || "main";
    let lastCommit: GitHubSyncStatus["lastCommit"] = undefined;
    let gitInitialized = false;

    try {
      // Check if git is initialized
      await execPromise("git rev-parse --is-inside-work-tree", { cwd: process.cwd() });
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
        uncommittedFiles.push(...lines.slice(0, 10).map((l) => l.trim()));
      } catch {}

      // Get last commit info
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
    } catch {
      gitInitialized = false;
    }

    const owner = config.owner || "ilyasylldrm-pixel";
    const repo = config.repo || "TALLSOFTMUAVIN";

    return {
      initialized: gitInitialized,
      branch: currentBranch,
      repoUrl: config.repoUrl || `https://github.com/${owner}/${repo}.git`,
      owner,
      repo,
      hasToken: Boolean(config.token && config.token.length > 5),
      maskedToken: maskToken(config.token),
      isClean,
      uncommittedCount,
      uncommittedFiles,
      lastCommit,
      lastSyncedAt: config.lastSyncedAt,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      repoWebUrl: `https://github.com/${owner}/${repo}`,
      deployUrl: "https://tallsoft.org",
    };
  }

  public async publishOrSync(params?: {
    commitMessage?: string;
    token?: string;
    repoUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    commitSha?: string;
    commitMessage?: string;
    syncedAt: string;
    actionsUrl: string;
    deployUrl: string;
  }> {
    const config = this.getConfig();
    const token = params?.token?.trim() || config.token;
    const repoUrl = params?.repoUrl?.trim() || config.repoUrl;
    const commitMsg =
      params?.commitMessage?.trim() ||
      `feat: Yayınlama ve senkronizasyon (${new Date().toLocaleString("tr-TR")})`;

    if (!token) {
      throw new Error(
        "GitHub Personal Access Token (PAT) bulunamadı. Lütfen Ayarlar veya Yayınla panelinden GitHub Token bilginizi kaydedin."
      );
    }

    // Ensure owner and repo are correct
    let owner = config.owner;
    let repo = config.repo;
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
    if (match) {
      owner = match[1];
      repo = match[2];
    }

    const cwd = process.cwd();

    // 1. Ensure git is initialized and branch is main
    try {
      await execPromise("git rev-parse --is-inside-work-tree", { cwd });
    } catch {
      await execPromise("git init", { cwd });
      await execPromise('git config user.name "Muavin"', { cwd });
      await execPromise('git config user.email "ilyasylldrm@gmail.com"', { cwd });
    }

    await execPromise("git branch -M main", { cwd });

    // 2. Stage changes
    await execPromise("git add .", { cwd });

    // 3. Commit if there are changes
    let committed = false;
    try {
      const { stdout: statusOut } = await execPromise("git status --porcelain", { cwd });
      if (statusOut.trim().length > 0) {
        // Escape quotes in commit message
        const safeMsg = commitMsg.replace(/"/g, '\\"');
        await execPromise(`git commit -m "${safeMsg}"`, { cwd });
        committed = true;
      }
    } catch (e) {
      console.warn("[GitHubSync] Commit step warning:", e);
    }

    // 4. Authenticated push to GitHub
    const authUrl = `https://${owner}:${token}@github.com/${owner}/${repo}.git`;
    try {
      await execPromise(`git remote set-url origin "${authUrl}"`, { cwd });
    } catch {
      await execPromise(`git remote add origin "${authUrl}"`, { cwd });
    }

    try {
      await execPromise("git push -u origin main --force", { cwd });
    } finally {
      // 5. Always sanitize remote URL so token is not left on disk
      try {
        await execPromise(
          `git remote set-url origin "https://github.com/${owner}/${repo}.git"`,
          { cwd }
        );
      } catch {}
    }

    // 6. Get latest commit SHA
    let sha = "";
    try {
      const { stdout: shaOut } = await execPromise("git rev-parse HEAD", { cwd });
      sha = shaOut.trim();
    } catch {}

    const syncedAt = new Date().toISOString();

    // 7. Update configuration with last sync timestamp & save token if new
    this.saveConfig({
      repoUrl,
      owner,
      repo,
      token,
      lastSyncedAt: syncedAt,
    });

    return {
      success: true,
      message: committed
        ? `Tüm değişiklikler başarıyla commit edildi ve GitHub'a aktarıldı. GitHub Actions (tallsoft.org dağıtımı) tetiklendi.`
        : `GitHub deposu güncellendi. Yeni bir değişiklik olmadığı için mevcut commit senkronize edildi.`,
      commitSha: sha,
      commitMessage: commitMsg,
      syncedAt,
      actionsUrl: `https://github.com/${owner}/${repo}/actions`,
      deployUrl: "https://tallsoft.org",
    };
  }
}

export const gitHubSyncService = new GitHubSyncService();

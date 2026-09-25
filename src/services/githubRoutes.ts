import { Router } from "express";
import { gitHubSyncService } from "./githubSyncService.ts";

export function getGitHubRouter(): Router {
  const router = Router();

  // Get current status of Git and GitHub sync
  router.get("/status", async (req, res) => {
    try {
      const status = await gitHubSyncService.getStatus();
      res.json({ success: true, ...status });
    } catch (error: any) {
      console.error("[GitHubRoute] Error getting status:", error);
      res.status(500).json({ success: false, error: error.message || "Durum alınamadı" });
    }
  });

  // Trigger publish / sync to GitHub
  router.post("/publish", async (req, res) => {
    try {
      const { commitMessage, token, repoUrl } = req.body || {};
      const result = await gitHubSyncService.publishOrSync({
        commitMessage,
        token,
        repoUrl,
      });
      res.json(result);
    } catch (error: any) {
      console.error("[GitHubRoute] Error publishing to GitHub:", error);
      res.status(500).json({
        success: false,
        error: error.message || "GitHub senkronizasyonu başarısız oldu",
      });
    }
  });

  // Alias for sync
  router.post("/sync", async (req, res) => {
    try {
      const { commitMessage, token, repoUrl } = req.body || {};
      const result = await gitHubSyncService.publishOrSync({
        commitMessage,
        token,
        repoUrl,
      });
      res.json(result);
    } catch (error: any) {
      console.error("[GitHubRoute] Error syncing with GitHub:", error);
      res.status(500).json({
        success: false,
        error: error.message || "GitHub senkronizasyonu başarısız oldu",
      });
    }
  });

  // Save config (token, repo url)
  router.post("/config", (req, res) => {
    try {
      const { repoUrl, token, autoSync } = req.body || {};
      const updated = gitHubSyncService.saveConfig({
        repoUrl,
        token,
        autoSync,
      });
      res.json({
        success: true,
        message: "GitHub senkronizasyon ayarları başarıyla güncellendi.",
        config: {
          repoUrl: updated.repoUrl,
          owner: updated.owner,
          repo: updated.repo,
          branch: updated.branch,
          hasToken: Boolean(updated.token),
          lastSyncedAt: updated.lastSyncedAt,
          autoSync: updated.autoSync,
        },
      });
    } catch (error: any) {
      console.error("[GitHubRoute] Error saving config:", error);
      res.status(500).json({ success: false, error: error.message || "Ayarlar kaydedilemedi" });
    }
  });

  // Test connection to GitHub with stored or passed token
  router.post("/test-connection", async (req, res) => {
    try {
      const config = gitHubSyncService.getConfig();
      const token = req.body?.token?.trim() || config.token;
      const owner = req.body?.owner?.trim() || config.owner;
      const repo = req.body?.repo?.trim() || config.repo;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Test için GitHub Personal Access Token (PAT) gereklidir.",
        });
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Muavin-Sync",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: (errorData as any).message || `GitHub API hatası (HTTP ${response.status})`,
        });
      }

      const repoData = await response.json();
      return res.json({
        success: true,
        message: "GitHub bağlantısı başarıyla doğrulandı!",
        repoName: (repoData as any).full_name,
        isPrivate: (repoData as any).private,
        defaultBranch: (repoData as any).default_branch,
        permissions: (repoData as any).permissions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "GitHub bağlantı testi başarısız oldu",
      });
    }
  });

  return router;
}

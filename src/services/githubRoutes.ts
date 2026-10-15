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
      console.warn("[GitHubRoute] Warning getting status:", error?.message || error);
      res.status(500).json({ success: false, error: error.message || "Durum alınamadı" });
    }
  });

  // Trigger publish / sync to GitHub (Pull + Commit + Push)
  router.post("/publish", async (req, res) => {
    try {
      const { commitMessage, token, repoUrl, pullFirst } = req.body || {};
      const result = await gitHubSyncService.publishOrSync({
        commitMessage,
        token,
        repoUrl,
        pullFirst: pullFirst !== false,
      });
      res.json(result);
    } catch (error: any) {
      console.warn("[GitHubRoute] Warning publishing to GitHub:", error?.message || error);
      res.json({
        success: false,
        code: error?.message?.includes("GitHub Personal Access Token") ? "MISSING_TOKEN" : "PUBLISH_WARNING",
        error: error.message || "GitHub senkronizasyonu tamamlanamadı",
      });
    }
  });

  // Pull / Fetch from GitHub
  router.post("/pull", async (req, res) => {
    try {
      const { token, repoUrl } = req.body || {};
      const result = await gitHubSyncService.pullFromGitHub({
        token,
        repoUrl,
      });
      res.json(result);
    } catch (error: any) {
      console.warn("[GitHubRoute] Warning pulling from GitHub:", error?.message || error);
      res.json({
        success: false,
        error: error.message || "GitHub'dan değişiklikler alınamadı",
      });
    }
  });

  // Bidirectional sync (Pull + Commit + Push)
  router.post("/sync", async (req, res) => {
    try {
      const { commitMessage, token, repoUrl } = req.body || {};
      const result = await gitHubSyncService.publishOrSync({
        commitMessage,
        token,
        repoUrl,
        pullFirst: true,
      });
      res.json(result);
    } catch (error: any) {
      console.warn("[GitHubRoute] Warning syncing with GitHub:", error?.message || error);
      res.json({
        success: false,
        code: error?.message?.includes("GitHub Personal Access Token") ? "MISSING_TOKEN" : "SYNC_WARNING",
        error: error.message || "GitHub senkronizasyonu tamamlanamadı",
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
      console.warn("[GitHubRoute] Warning saving config:", error?.message || error);
      res.status(500).json({ success: false, error: error.message || "Ayarlar kaydedilemedi" });
    }
  });

  // Test connection to GitHub with stored or passed token (verifies both read and write/push permissions)
  router.post("/test-connection", async (req, res) => {
    try {
      const config = gitHubSyncService.getConfig();
      const token = req.body?.token?.trim() || config.token;
      const owner = req.body?.owner?.trim() || config.owner || "ilyasylldrm-pixel";
      const repo = req.body?.repo?.trim() || config.repo || "TALLSOFTMUAVIN";
      const branch = config.branch || "main";

      if (!token) {
        return res.json({
          success: false,
          code: "MISSING_TOKEN",
          error: "Test için GitHub Personal Access Token (PAT) gereklidir.",
        });
      }

      const permCheck = await gitHubSyncService.verifyTokenPermissions(token, owner, repo, branch, false);

      if (!permCheck.valid || !permCheck.canRead) {
        return res.json({
          success: false,
          code: permCheck.errorCode || "INVALID_TOKEN",
          error: permCheck.errorReason || "GitHub bağlantısı doğrulanamadı.",
        });
      }

      if (!permCheck.canPush) {
        return res.json({
          success: false,
          code: "TOKEN_READ_ONLY",
          canRead: true,
          canPush: false,
          repoName: permCheck.repoName,
          isPrivate: permCheck.isPrivate,
          defaultBranch: permCheck.defaultBranch,
          error:
            permCheck.errorReason ||
            "Token okuma (Pull) yetkisine sahip ancak yazma (Push) yetkisi kapalı (HTTP 403). GitHub Token ayarlarından 'Contents: Read and write' iznini açın.",
        });
      }

      return res.json({
        success: true,
        canRead: true,
        canPush: true,
        message: "GitHub okuma (Pull) ve yazma (Push) bağlantısı başarıyla doğrulandı!",
        repoName: permCheck.repoName,
        isPrivate: permCheck.isPrivate,
        defaultBranch: permCheck.defaultBranch,
        permissions: permCheck.permissions,
      });
    } catch (error: any) {
      return res.json({
        success: false,
        error: error.message || "GitHub bağlantı testi başarısız oldu",
      });
    }
  });

  return router;
}


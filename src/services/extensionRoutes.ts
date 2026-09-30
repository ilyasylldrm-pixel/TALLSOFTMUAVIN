import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

export function getExtensionRouter(): Router {
  const router = Router();

  // Status check endpoint
  router.get("/status", (req: Request, res: Response) => {
    res.json({
      success: true,
      extension: "Muavin E-İşlem Asistanı",
      version: "1.0.0",
      status: "ready",
    });
  });

  // Returns active company credentials for the extension
  router.get("/credentials", (req: Request, res: Response) => {
    try {
      const dataPath = path.join(process.cwd(), "data", "company_settings.json");
      let companySettings: any = null;

      if (fs.existsSync(dataPath)) {
        companySettings = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      }

      // Default demo fallback if no stored company settings on server yet
      if (!companySettings) {
        companySettings = {
          companyName: "Atlas Teknoloji San. ve Tic. A.Ş.",
          taxNumber: "3484702910",
          taxOffice: "Kadıköy Vergi Dairesi",
          taxCredentials: {
            userCode: "3484702910",
            password: "••••••••",
            codeSecret: "GIB-84920",
          },
          sgkCredentials: {
            userCode: "SGK-ATLAS-34",
            systemPassword: "••••••••",
            workplacePassword: "••••••••",
            workplaceRegistrationNo: "2 1234 01 01 1234567 034 12-34 000",
            workplaceCode: "000",
            workplaces: [
              {
                id: "main_default",
                name: "Merkez Ofis",
                type: "main",
                userCode: "SGK-ATLAS-34",
                workplaceCode: "000",
                systemPassword: "••••••••",
                workplacePassword: "••••••••",
                workplaceRegistrationNo: "2 1234 01 01 1234567 034 12-34 000",
              },
            ],
          },
          eDevletCredentials: {
            tckn: "12345678901",
            password: "••••••••",
            mobileSignaturePhone: "+90 (555) 123 45 67",
          },
        };
      }

      res.json({
        success: true,
        data: companySettings,
        syncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Şirket bilgileri alınamadı." });
    }
  });

  // Sync credentials from web client to server state
  router.post("/sync", (req: Request, res: Response) => {
    try {
      const companySettings = req.body;
      const dataDir = path.join(process.cwd(), "data");
      const dataPath = path.join(dataDir, "company_settings.json");

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(dataPath, JSON.stringify(companySettings, null, 2), "utf-8");

      res.json({
        success: true,
        message: "Şirket şifreleri eklenti için başarıyla kaydedildi.",
        data: companySettings,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Kayıt başarısız oldu." });
    }
  });

  // Download extension as a ready-to-use ZIP file
  router.get("/download-zip", (req: Request, res: Response) => {
    try {
      const extensionDir = path.join(process.cwd(), "extension");
      const distDir = path.join(process.cwd(), "dist");
      const zipPath = path.join(distDir, "muavin-eklenti.zip");

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Generate zip using PowerShell Compress-Archive on Windows
      if (process.platform === "win32") {
        execSync(`powershell -Command "Compress-Archive -Path '${extensionDir}/*' -DestinationPath '${zipPath}' -Force"`);
      } else {
        execSync(`cd "${extensionDir}" && zip -r "${zipPath}" ./*`);
      }

      if (fs.existsSync(zipPath)) {
        res.download(zipPath, "muavin-eklenti.zip", (err) => {
          if (err) console.warn("Eklenti zip indirme uyarısı:", err);
        });
      } else {
        res.status(500).send("Eklenti arşivi oluşturulamadı.");
      }
    } catch (err: any) {
      res.status(500).send("Eklenti ZIP oluşturulurken hata: " + err.message);
    }
  });

  return router;
}

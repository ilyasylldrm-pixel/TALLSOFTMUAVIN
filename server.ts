import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini client lazily
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appName: "Muavin - Ön Muhasebe Programı" });
});

// Database health check endpoint
app.get("/api/db/health", async (req, res) => {
  try {
    const { db } = await import("./src/db/index.ts");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    res.json({ status: "ok", database: "PostgreSQL", timestamp: result.rows[0]?.current_time });
  } catch (error: any) {
    console.error("Database health check error:", error);
    res.status(500).json({ status: "error", message: "Database connection unavailable", details: error.message });
  }
});

// AI Assistant endpoint: Finansal Tavsiye & Doğal Dil Komut İşleme
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tanımlanmamış. AI özellikleri için API anahtarı gereklidir.",
      });
    }

    const { prompt, contextData, mode } = req.body;

    let systemInstruction = `Sen "Muavin" isimli Türk Ön Muhasebe Yazılımının akıllı yapay zeka finansal asistanısın. 
Kullanıcının muhasebe verilerini (cari hesaplar, faturalar, kasa/banka bakiyeleri, gelir/giderler) analiz eder, sorularını yanıtlar, önerilerde bulunur veya verilen doğal dildeki talebi ayrıştırarak yapılandırılmış JSON verisi üretirsin.
Yanıtların her zaman profesyonel, anlaşılır, Türkçe ve Türk Ticaret / Vergi mevzuatına uygun terminolojiye sahip olmalıdır. (KDV oranları %1, %10, %20; Tevkifat, Stopaj, Cari Bakiye, Borç, Alacak, Tediye, Tahsilat vb.)`;

    if (mode === "parse_command") {
      systemInstruction += `\nKullanıcının girdiği serbest metinden (ör: "Ahmet Yılmaz'a 10000 TL + KDVyazılım faturası kes" veya "Elektrik faturası için 1500 TL Garanti bankasından ödeme yapıldı") bir eylem (fatura, gelir_gider, tahsilat_tediye, cari_ekle) çıkarıp strictly JSON formatında dön.
Schema:
{
  "type": "invoice" | "expense" | "payment" | "contact" | "general_query",
  "data": {
    "title": string,
    "contactName": string,
    "amount": number,
    "vatRate": number (1, 10 or 20),
    "category": string,
    "account": string,
    "description": string,
    "typeDetails": string ("sales" | "purchase" | "income" | "expense")
  },
  "summary": string
}`;
    }

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          text: `Kullanıcı İletisi / Komutu: ${prompt}\n\nMevcut Muhasebe Özet Verileri:\n${JSON.stringify(
            contextData || {},
            null,
            2
          )}`,
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error("Gemini API hatası:", err);
    res.status(500).json({ error: err.message || "AI servisinde hata oluştu." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Muavin Muhasebe sunucusu çalışıyor: http://0.0.0.0:${PORT}`);
  });
}

startServer();

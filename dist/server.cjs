var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var genAI = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAI;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appName: "Muavin - \xD6n Muhasebe Program\u0131" });
});
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const aiClient = getGenAI();
    if (!aiClient) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tan\u0131mlanmam\u0131\u015F. AI \xF6zellikleri i\xE7in API anahtar\u0131 gereklidir."
      });
    }
    const { prompt, contextData, mode } = req.body;
    let systemInstruction = `Sen "Muavin" isimli T\xFCrk \xD6n Muhasebe Yaz\u0131l\u0131m\u0131n\u0131n ak\u0131ll\u0131 yapay zeka finansal asistan\u0131s\u0131n. 
Kullan\u0131c\u0131n\u0131n muhasebe verilerini (cari hesaplar, faturalar, kasa/banka bakiyeleri, gelir/giderler) analiz eder, sorular\u0131n\u0131 yan\u0131tlar, \xF6nerilerde bulunur veya verilen do\u011Fal dildeki talebi ayr\u0131\u015Ft\u0131rarak yap\u0131land\u0131r\u0131lm\u0131\u015F JSON verisi \xFCretirsin.
Yan\u0131tlar\u0131n her zaman profesyonel, anla\u015F\u0131l\u0131r, T\xFCrk\xE7e ve T\xFCrk Ticaret / Vergi mevzuat\u0131na uygun terminolojiye sahip olmal\u0131d\u0131r. (KDV oranlar\u0131 %1, %10, %20; Tevkifat, Stopaj, Cari Bakiye, Bor\xE7, Alacak, Tediye, Tahsilat vb.)`;
    if (mode === "parse_command") {
      systemInstruction += `
Kullan\u0131c\u0131n\u0131n girdi\u011Fi serbest metinden (\xF6r: "Ahmet Y\u0131lmaz'a 10000 TL + KDVyaz\u0131l\u0131m faturas\u0131 kes" veya "Elektrik faturas\u0131 i\xE7in 1500 TL Garanti bankas\u0131ndan \xF6deme yap\u0131ld\u0131") bir eylem (fatura, gelir_gider, tahsilat_tediye, cari_ekle) \xE7\u0131kar\u0131p strictly JSON format\u0131nda d\xF6n.
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
          text: `Kullan\u0131c\u0131 \u0130letisi / Komutu: ${prompt}

Mevcut Muhasebe \xD6zet Verileri:
${JSON.stringify(
            contextData || {},
            null,
            2
          )}`
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });
    res.json({ result: response.text });
  } catch (err) {
    console.error("Gemini API hatas\u0131:", err);
    res.status(500).json({ error: err.message || "AI servisinde hata olu\u015Ftu." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Muavin Muhasebe sunucusu \xE7al\u0131\u015F\u0131yor: http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

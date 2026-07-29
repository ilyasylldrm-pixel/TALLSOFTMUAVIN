// Idempotent server.ts deploy fixes for Windows/IIS (Plesk iisnode).
// AI Studio'nun ürettiği orijinal server.ts iisnode'da CALISMAZ; bu betik
// 6 zorunlu duzeltmeyi tekrar tekrar guvenle uygular. Zaten uygulanmissa no-op.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "..", "server.ts");
let src = readFileSync(serverPath, "utf8");
const before = src;

const fixes = [
  // 1. PORT: iisnode named pipe string verir, sabit 3000 iisnode'u bozar
  [/const PORT = 3000;/g, "const PORT = process.env.PORT || 3000;"],
  // 2. listen: host argumani ("0.0.0.0") iisnode named pipe ile uyumsuz
  [/app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/g, "app.listen(PORT, () => {"],
  // 3. dotenv: cwd guvenilmez, .env httpdocs kokunde (dist'in bir ust dizini)
  [/dotenv\.config\(\);/g, 'dotenv.config({ path: path.join(__dirname, "..", ".env") });'],
  // 4. static path: process.cwd() yerine __dirname (server.cjs dist icinde)
  [/const distPath = path\.join\(process\.cwd\(\), "dist"\);/g, "const distPath = __dirname;"],
  // 6. gecersiz model adi
  [/model: "gemini-3\.6-flash",/g, 'model: process.env.GEMINI_MODEL || "gemini-2.5-flash",'],
];

for (const [re, rep] of fixes) src = src.replace(re, rep);

// 5. vite importu statikten dinamige (production'da gerekmez).
// SADECE statik import varsa tetikle - yoksa cift import satiri olusur (idempotent koruma).
if (/^import \{ createServer as createViteServer \} from "vite";\n/m.test(src)) {
  src = src.replace(/^import \{ createServer as createViteServer \} from "vite";\n/m, "");
  src = src.replace(
    /const vite = await createViteServer\(\{/,
    'const { createServer: createViteServer } = await import("vite");\n    const vite = await createViteServer({'
  );
}

if (src !== before) {
  writeFileSync(serverPath, src, "utf8");
  console.log("deploy fixes applied to server.ts");
} else {
  console.log("deploy fixes already present (no-op)");
}

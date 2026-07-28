// Windows/IIS (Plesk iisnode) + ortam yükleme düzeltmelerini idempotent uygular.
// AI Studio'nun ürettiği server.ts bu düzeltmeleri içermez; her build öncesi
// otomatik uygulanır ki geliştirici kaynağı yenilese bile deploy bozulmasın.
import fs from "fs";
const f = "server.ts";
let s = fs.readFileSync(f, "utf8");
const before = s;
s = s.replace('import { createServer as createViteServer } from "vite";\n', "");
s = s.replace("dotenv.config();", 'dotenv.config({ path: path.join(__dirname, "..", ".env") });');
s = s.replace("const PORT = 3000;", "const PORT = process.env.PORT || 3000;");
s = s.replace('model: "gemini-3.6-flash"', 'model: process.env.GEMINI_MODEL || "gemini-2.5-flash"');
s = s.replace(
  /if \(process\.env\.NODE_ENV !== "production"\) \{\n(\s*)const vite = await createViteServer\(/,
  'if (process.env.NODE_ENV !== "production") {\n$1const { createServer: createViteServer } = await import("vite");\n$1const vite = await createViteServer('
);
s = s.replace('const distPath = path.join(process.cwd(), "dist");', "const distPath = __dirname;");
s = s.replace('app.listen(PORT, "0.0.0.0", () => {', "app.listen(PORT, () => {");
if (s !== before) { fs.writeFileSync(f, s); console.log("deploy fixes applied"); }
else { console.log("deploy fixes already present (no-op)"); }

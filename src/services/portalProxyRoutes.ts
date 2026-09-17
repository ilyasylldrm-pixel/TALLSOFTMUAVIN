import { Router, Request, Response } from "express";

export interface PortalConfig {
  id: string;
  name: string;
  category: "gib" | "sgk" | "edevlet" | "mersis";
  targetUrl: string;
  description: string;
  badge: string;
}

export const OFFICIAL_PORTALS: Record<string, PortalConfig> = {
  gib_dijital: {
    id: "gib_dijital",
    name: "GİB Dijital Vergi Dairesi",
    category: "gib",
    targetUrl: "https://dijital.gib.gov.tr",
    description: "Beyannameler, vergi levhası, borç durumu ve İnteraktif Vergi Dairesi işlemleri",
    badge: "Resmi Vergi Dairesi",
  },
  gib_earsiv: {
    id: "gib_earsiv",
    name: "GİB e-Arşiv Fatura Portalı",
    category: "gib",
    targetUrl: "https://earsivportal.efatura.gov.tr/intragiris.html",
    description: "5.000 TL / 30.000 TL GİB resmi e-Arşiv fatura düzenleme ve sorgulama ekranı",
    badge: "5.000/30.000 Portal",
  },
  sgk_isveren: {
    id: "sgk_isveren",
    name: "SGK İşveren Sistemi",
    category: "sgk",
    targetUrl: "https://uyg.sgk.gov.tr/IsverenSistemi",
    description: "İşyeri tescil, istihdam teşvikleri, borç sorgulama ve işveren işlemleri",
    badge: "İşveren Portalı",
  },
  sgk_ebildirge: {
    id: "sgk_ebildirge",
    name: "SGK e-Bildirge v2",
    category: "sgk",
    targetUrl: "https://ebildirge.sgk.gov.tr/EBildirgeV2",
    description: "Aylık prim ve hizmet belgeleri, MUHSGK ve sigortalı bildirimleri",
    badge: "e-Bildirge v2",
  },
  edevlet: {
    id: "edevlet",
    name: "e-Devlet Kapısı Kurumsal",
    category: "edevlet",
    targetUrl: "https://giris.turkiye.gov.tr/Giris/",
    description: "T.C. e-Devlet Kapısı resmi kurum ve şirket yetkili işlem girişi",
    badge: "e-Devlet",
  },
  mersis: {
    id: "mersis",
    name: "Ticaret Bakanlığı MERSİS",
    category: "mersis",
    targetUrl: "https://mersis.gtb.gov.tr/",
    description: "Merkezi Sicil Kayıt Sistemi, Ticaret Sicil ve şirket kuruluş/değişiklik işlemleri",
    badge: "MERSİS",
  },
  etebligat_gib: {
    id: "etebligat_gib",
    name: "GİB e-Tebligat",
    category: "gib",
    targetUrl: "https://dijital.gib.gov.tr",
    description: "Gelir İdaresi Başkanlığı resmi elektronik tebligat ve ihbarname kontrolü",
    badge: "GİB Tebligat",
  },
  etebligat_sgk: {
    id: "etebligat_sgk",
    name: "SGK e-Tebligat",
    category: "sgk",
    targetUrl: "https://etebligat.sgk.gov.tr/",
    description: "Sosyal Güvenlik Kurumu resmi elektronik tebligat ve ödeme emirleri",
    badge: "SGK Tebligat",
  },
};

const AUTOFILL_BRIDGE_SCRIPT = `
<script id="muavin-autofill-bridge">
(function() {
  console.log("⚡ Muavin AutoFill Bridge devrede.");
  
  // Create floating auto-fill indicator bar inside the frame
  var bar = document.createElement("div");
  bar.id = "muavin-floating-status";
  bar.style.position = "fixed";
  bar.style.bottom = "12px";
  bar.style.right = "12px";
  bar.style.zIndex = "9999999";
  bar.style.background = "#0f172a";
  bar.style.color = "#34d399";
  bar.style.border = "1px solid #059669";
  bar.style.padding = "7px 14px";
  bar.style.borderRadius = "12px";
  bar.style.fontSize = "11px";
  bar.style.fontWeight = "bold";
  bar.style.fontFamily = "system-ui, -apple-system, sans-serif";
  bar.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.cursor = "pointer";
  bar.style.transition = "all 0.2s ease";
  bar.innerHTML = "⚡ Muavin Entegre Köprüsü Aktif";
  document.body.appendChild(bar);

  function setFieldValue(selectors, val) {
    if (!val) return false;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.offsetParent !== null) {
        el.value = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        el.style.borderColor = "#10b981";
        el.style.backgroundColor = "#ecfdf5";
        return true;
      }
    }
    return false;
  }

  function executeAutoFill(data) {
    if (!data) return 0;
    var filledCount = 0;

    var taxCreds = data.taxCredentials || {};
    var sgkCreds = data.sgkCredentials || {};
    var activeWp = (sgkCreds.workplaces && sgkCreds.workplaces[0]) || sgkCreds;
    var edevlet = data.eDevletCredentials || {};

    // GİB Fields
    var userCode = data.userCode || taxCreds.userCode || data.taxNumber || "";
    var password = data.password || taxCreds.password || "";
    var codeSecret = data.codeSecret || taxCreds.codeSecret || "";

    if (setFieldValue(['input[name="kullaniciKodu"]', 'input[id*="kullanici"]', 'input[name="username"]', 'input[name="userid"]', '#userid', '#kullaniciKodu'], userCode)) filledCount++;
    if (setFieldValue(['input[name="parola"]', 'input[id*="parola"]', 'input[name="password"]', '#password', '#parola', 'input[type="password"]'], password)) filledCount++;
    if (setFieldValue(['input[name="sifre"]', 'input[id*="sifre"]', 'input[name="codeSecret"]', '#sifre', '#codeSecret'], codeSecret)) filledCount++;

    // SGK Fields
    var sgkUser = data.userCode || activeWp.userCode || sgkCreds.userCode || "";
    var wpCode = data.workplaceCode || activeWp.workplaceCode || "000";
    var sysPass = data.systemPassword || activeWp.systemPassword || sgkCreds.systemPassword || "";
    var wpPass = data.workplacePassword || activeWp.workplacePassword || sgkCreds.workplacePassword || "";
    var wpSicil = data.workplaceRegistrationNo || activeWp.workplaceRegistrationNo || "";

    if (setFieldValue(['input[name="kullaniciKodu"]', '#kullaniciKodu'], sgkUser)) filledCount++;
    if (setFieldValue(['input[name="isyeriKodu"]', 'input[id*="isyeriKodu"]', '#isyeriKodu'], wpCode)) filledCount++;
    if (setFieldValue(['input[name="sistemSifresi"]', 'input[id*="sistemSifresi"]', '#sistemSifresi'], sysPass)) filledCount++;
    if (setFieldValue(['input[name="isyeriSifresi"]', 'input[id*="isyeriSifresi"]', '#isyeriSifresi'], wpPass)) filledCount++;
    if (setFieldValue(['input[name="isyeriSicil"]', 'input[id*="isyeriSicil"]', '#isyeriSicil'], wpSicil)) filledCount++;

    // e-Devlet Fields
    var tckn = data.tckn || edevlet.tckn || data.taxNumber || "";
    var edevPass = data.eDevletPassword || edevlet.password || "";
    if (setFieldValue(['#tridfield', 'input[name="tridfield"]', 'input[id*="trid"]'], tckn)) filledCount++;
    if (setFieldValue(['#egpField', 'input[name="egpField"]', 'input[id*="egp"]'], edevPass)) filledCount++;

    // MERSİS Fields
    if (setFieldValue(['#UserName', 'input[name="UserName"]'], userCode)) filledCount++;
    if (setFieldValue(['#Password', 'input[name="Password"]'], password)) filledCount++;

    if (filledCount > 0) {
      bar.innerHTML = "✅ " + filledCount + " Alan Otomatik Dolduruldu";
      bar.style.background = "#064e3b";
      bar.style.color = "#a7f3d0";
      setTimeout(function() {
        bar.innerHTML = "⚡ Muavin Entegre Köprüsü Aktif";
        bar.style.background = "#0f172a";
        bar.style.color = "#34d399";
      }, 4000);
    }

    var captcha = document.querySelector('input[name*="guvenlik"], input[id*="captcha"], input[name*="captcha"], input[id*="guvenlik"]');
    if (captcha) {
      captcha.focus();
    }

    return filledCount;
  }

  // Auto-fetch credentials from backend on frame load
  try {
    fetch("/api/extension/credentials")
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json && json.data) {
          setTimeout(function() { executeAutoFill(json.data); }, 600);
          setTimeout(function() { executeAutoFill(json.data); }, 1800);
        }
      })
      .catch(function() {});
  } catch (e) {}

  // Bar click trigger
  bar.addEventListener("click", function() {
    fetch("/api/extension/credentials")
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json && json.data) {
          var count = executeAutoFill(json.data);
          if (count === 0) {
            bar.innerHTML = "⚠️ Form alanı bulunamadı";
            setTimeout(function() { bar.innerHTML = "⚡ Muavin Entegre Köprüsü Aktif"; }, 3000);
          }
        }
      })
      .catch(function() {});
  });

  window.addEventListener("message", function(event) {
    if (!event.data || event.data.type !== "MUAVIN_AUTOFILL") return;
    var count = executeAutoFill(event.data.payload || {});
    if (window.parent) {
      window.parent.postMessage({ type: "MUAVIN_AUTOFILL_SUCCESS", filledCount: count }, "*");
    }
  });
})();
</script>
`;

export function getPortalProxyRouter(): Router {
  const router = Router();

  // Get list of supported portals
  router.get("/list", (req: Request, res: Response) => {
    res.json({ success: true, portals: Object.values(OFFICIAL_PORTALS) });
  });

  // Reverse proxy for GİB e-Arşiv services & dispatch
  router.all("/earsiv/*", async (req: Request, res: Response) => {
    const subPath = (req.params as any)[0] || "";
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const targetUrl = `https://earsivportal.efatura.gov.tr/${subPath}${queryString}`;

    try {
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://earsivportal.efatura.gov.tr/intragiris.html",
        Origin: "https://earsivportal.efatura.gov.tr",
      };

      if (req.headers["content-type"]) {
        headers["Content-Type"] = req.headers["content-type"] as string;
      }
      if (req.headers["cookie"]) {
        headers["Cookie"] = req.headers["cookie"] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
        if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
          fetchOptions.body = req.body;
        } else if (typeof req.body === "object") {
          if (req.headers["content-type"]?.includes("application/json")) {
            fetchOptions.body = JSON.stringify(req.body);
          } else {
            fetchOptions.body = new URLSearchParams(req.body as any).toString();
          }
        }
      }

      const response = await fetch(targetUrl, fetchOptions);
      const contentType = response.headers.get("content-type") || "text/plain";

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        res.setHeader("Set-Cookie", setCookie);
      }

      res.status(response.status);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.warn("GİB e-Arşiv proxy hatası:", err?.message);
      res.status(500).json({ error: "1", messages: [{ type: "1", text: err?.message || "Bağlantı hatası" }] });
    }
  });

  // Proxy view endpoint for portal
  router.get("/view/:portalKey", async (req: Request, res: Response) => {
    const { portalKey } = req.params;
    const portal = OFFICIAL_PORTALS[portalKey];

    if (!portal) {
      return res.status(404).send(`<h3>Portal bulunamadı: ${portalKey}</h3>`);
    }

    try {
      const response = await fetch(portal.targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      const contentType = response.headers.get("content-type") || "text/html";
      let html = await response.text();

      // For e-Arşiv, redirect internal dispatch calls to our proxy endpoint
      if (portalKey === "gib_earsiv") {
        html = html.replace(
          /var\s+hostName\s*=\s*window\.location\.protocol\s*\+\s*'\/\/'\s*\+\s*window\.location\.host;?/g,
          'var hostName = "/api/portal-proxy/earsiv";'
        );
      }

      // Rewrite base URL so relative images, scripts, and CSS load from the target server
      const baseTag = `<base href="${portal.targetUrl}/" />`;
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>\n  ${baseTag}\n`);
      } else if (html.includes("<HEAD>")) {
        html = html.replace("<HEAD>", `<HEAD>\n  ${baseTag}\n`);
      } else {
        html = `${baseTag}\n${html}`;
      }

      // Inject AutoFill bridge script before </body> or at the end
      if (html.includes("</body>")) {
        html = html.replace("</body>", `${AUTOFILL_BRIDGE_SCRIPT}\n</body>`);
      } else if (html.includes("</BODY>")) {
        html = html.replace("</BODY>", `${AUTOFILL_BRIDGE_SCRIPT}\n</BODY>`);
      } else {
        html += AUTOFILL_BRIDGE_SCRIPT;
      }

      // Strip frame prevention headers
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.removeHeader("Content-Security-Policy-Report-Only");

      // Set permissible headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", contentType);

      res.send(html);
    } catch (err: any) {
      console.warn(`Portal proxy hatası (${portalKey}):`, err?.message);
      // Return a graceful embedded fallback view
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${portal.name} - Muavin Gömülü Portal</title>
          <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
            .card { background: #1e293b; border: 1px solid #334155; max-width: 600px; margin: 40px auto; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #38bdf8; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .btn { display: inline-block; background: #059669; color: #fff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin-top: 20px; }
            .badge { display: inline-block; background: #0284c7; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">${portal.badge}</span>
            <h2>${portal.name}</h2>
            <p>${portal.description}</p>
            <p>Portal sunucusuna doğrudan bağlantı başlatılıyor...</p>
            <a href="${portal.targetUrl}" target="_blank" class="btn">🚀 Portala Doğrudan Git</a>
          </div>
          ${AUTOFILL_BRIDGE_SCRIPT}
        </body>
        </html>
      `);
    }
  });

  return router;
}

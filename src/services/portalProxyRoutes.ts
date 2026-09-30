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
  bar.style.padding = "6px 12px";
  bar.style.borderRadius = "12px";
  bar.style.fontSize = "11px";
  bar.style.fontWeight = "bold";
  bar.style.fontFamily = "sans-serif";
  bar.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "6px";
  bar.style.cursor = "pointer";
  bar.innerHTML = "⚡ Muavin Köprüsü Aktif";
  document.body.appendChild(bar);

  function setFieldValue(selectors, val) {
    if (!val) return false;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
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

  window.addEventListener("message", function(event) {
    if (!event.data || event.data.type !== "MUAVIN_AUTOFILL") return;
    var data = event.data.payload || {};
    var filledCount = 0;

    // GİB Fields
    if (setFieldValue(['input[name="kullaniciKodu"]', 'input[id*="kullanici"]', 'input[name="username"]', 'input[name="userid"]', '#userid', '#kullaniciKodu'], data.userCode || data.taxNumber)) filledCount++;
    if (setFieldValue(['input[name="parola"]', 'input[id*="parola"]', 'input[name="password"]', '#password', '#parola', 'input[type="password"]'], data.password)) filledCount++;
    if (setFieldValue(['input[name="sifre"]', 'input[id*="sifre"]', 'input[name="codeSecret"]', '#sifre', '#codeSecret'], data.codeSecret)) filledCount++;

    // SGK Fields
    if (setFieldValue(['input[name="isyeriKodu"]', 'input[id*="isyeriKodu"]', '#isyeriKodu'], data.workplaceCode)) filledCount++;
    if (setFieldValue(['input[name="sistemSifresi"]', 'input[id*="sistemSifresi"]', '#sistemSifresi'], data.systemPassword)) filledCount++;
    if (setFieldValue(['input[name="isyeriSifresi"]', 'input[id*="isyeriSifresi"]', '#isyeriSifresi'], data.workplacePassword)) filledCount++;
    if (setFieldValue(['input[name="isyeriSicil"]', 'input[id*="isyeriSicil"]', '#isyeriSicil'], data.workplaceRegistrationNo)) filledCount++;

    // e-Devlet Fields
    if (setFieldValue(['#tridfield', 'input[name="tridfield"]', 'input[id*="trid"]'], data.tckn || data.userCode)) filledCount++;
    if (setFieldValue(['#egpField', 'input[name="egpField"]', 'input[id*="egp"]'], data.eDevletPassword)) filledCount++;

    // MERSİS Fields
    if (setFieldValue(['#UserName', 'input[name="UserName"]'], data.userCode)) filledCount++;
    if (setFieldValue(['#Password', 'input[name="Password"]'], data.password)) filledCount++;

    bar.innerHTML = "✅ " + filledCount + " Alan Otomatik Dolduruldu";
    bar.style.background = "#064e3b";
    bar.style.color = "#a7f3d0";
    setTimeout(function() {
      bar.innerHTML = "⚡ Muavin Köprüsü Aktif";
      bar.style.background = "#0f172a";
      bar.style.color = "#34d399";
    }, 4000);

    // Try focusing on captcha if present
    var captcha = document.querySelector('input[name*="guvenlik"], input[id*="captcha"], input[name*="captcha"], input[id*="guvenlik"]');
    if (captcha) {
      captcha.focus();
    }

    if (window.parent) {
      window.parent.postMessage({ type: "MUAVIN_AUTOFILL_SUCCESS", filledCount: filledCount }, "*");
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

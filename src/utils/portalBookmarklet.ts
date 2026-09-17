import { CompanySettings } from "../types";

/**
 * Generates a zero-install, zero-zip Bookmarklet script that works on
 * any browser (Chrome, Edge, Safari, Firefox, Opera, Brave, etc.).
 * When dragged to the Bookmarks/Favorites bar, users simply click it
 * while on any official portal (dijital.gib.gov.tr, uyg.sgk.gov.tr, turkiye.gov.tr, mersis.gtb.gov.tr).
 * It detects the portal, fills all username/password/workplace fields,
 * and focuses the security code (CAPTCHA) box.
 */
export function generatePortalBookmarklet(company: CompanySettings): {
  bookmarkletHref: string;
  rawScript: string;
} {
  const taxCreds = company.taxCredentials || {};
  const activeWp = company.sgkCredentials?.workplaces?.[0] || company.sgkCredentials || {};
  const edevletCreds = company.eDevletCredentials || {};

  const payload = {
    cName: company.companyName || "Muavin",
    taxNo: company.taxNumber || "",
    taxUser: taxCreds.userCode || company.taxNumber || "",
    taxPass: taxCreds.password || "",
    taxSec: taxCreds.codeSecret || "",
    sgkUser: activeWp.userCode || company.sgkCredentials?.userCode || "",
    sgkWpCode: activeWp.workplaceCode || company.sgkCredentials?.workplaceCode || "000",
    sgkSysPass: activeWp.systemPassword || company.sgkCredentials?.systemPassword || "",
    sgkWpPass: activeWp.workplacePassword || company.sgkCredentials?.workplacePassword || "",
    sgkRegNo: (activeWp.workplaceRegistrationNo || company.sgkCredentials?.workplaceRegistrationNo || "").replace(/\./g, ""),
    tckn: edevletCreds.tckn || company.taxNumber || "",
    edPass: edevletCreds.password || "",
  };

  const payloadJson = JSON.stringify(payload);

  const rawScript = `(function() {
  var c = ${payloadJson};
  var filled = 0;

  function setVal(selectors, val) {
    if (!val) return false;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.offsetParent !== null) {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.style.borderColor = '#10b981';
        el.style.backgroundColor = '#ecfdf5';
        return true;
      }
    }
    return false;
  }

  // 1. GİB Dijital Vergi Dairesi / İVD / e-Arşiv Fatura
  if (setVal(['input[name="kullaniciKodu"]', 'input[id*="kullanici"]', 'input[name="username"]', 'input[name="userid"]', '#userid', '#kullaniciKodu'], c.taxUser || c.taxNo)) filled++;
  if (setVal(['input[name="parola"]', 'input[id*="parola"]', 'input[name="password"]', '#password', '#parola', 'input[type="password"]'], c.taxPass)) filled++;
  if (setVal(['input[name="sifre"]', 'input[id*="sifre"]', 'input[name="codeSecret"]', '#sifre', '#codeSecret'], c.taxSec)) filled++;

  // 2. SGK İşveren Sistemi & e-Bildirge v2
  if (setVal(['input[name="kullaniciKodu"]', '#kullaniciKodu'], c.sgkUser)) filled++;
  if (setVal(['input[name="isyeriKodu"]', '#isyeriKodu'], c.sgkWpCode)) filled++;
  if (setVal(['input[name="sistemSifresi"]', '#sistemSifresi'], c.sgkSysPass)) filled++;
  if (setVal(['input[name="isyeriSifresi"]', '#isyeriSifresi'], c.sgkWpPass)) filled++;
  if (setVal(['input[name="isyeriSicil"]', '#isyeriSicil'], c.sgkRegNo)) filled++;

  // 3. e-Devlet Kapısı Kurumsal Giriş
  if (setVal(['#tridfield', 'input[name="tridfield"]', 'input[id*="trid"]'], c.tckn || c.taxNo)) filled++;
  if (setVal(['#egpField', 'input[name="egpField"]', 'input[id*="egp"]'], c.edPass)) filled++;

  // 4. MERSİS Girişi
  if (setVal(['#UserName', 'input[name="UserName"]'], c.taxUser || c.taxNo)) filled++;
  if (setVal(['#Password', 'input[name="Password"]'], c.taxPass)) filled++;

  // 5. Güvenlik Koduna (CAPTCHA) Otomatik Odaklan
  var cap = document.querySelector('input[name*="guvenlik"], input[id*="captcha"], input[name*="captcha"], input[id*="guvenlik"]');
  if (cap) {
    cap.focus();
    cap.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.4)';
  }

  // 6. Ekranda Şık Bildirim Rozeti Göster
  var toast = document.createElement('div');
  toast.id = 'muavin-bookmarklet-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.zIndex = '999999999';
  toast.style.background = '#0f172a';
  toast.style.color = '#34d399';
  toast.style.padding = '14px 20px';
  toast.style.borderRadius = '16px';
  toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 12px 30px rgba(0,0,0,0.45)';
  toast.style.border = '1px solid #059669';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.transition = 'all 0.3s ease';

  if (filled > 0) {
    toast.innerHTML = '<span>⚡</span> <span><strong>Muavin:</strong> ' + c.cName + ' için ' + filled + ' giriş alanı otomatik dolduruldu!</span>';
  } else {
    toast.style.borderColor = '#d97706';
    toast.style.color = '#fbbf24';
    toast.innerHTML = '<span>⚠️</span> <span><strong>Muavin:</strong> Bu sayfada doldurulacak giriş formu bulunamadı.</span>';
  }

  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(function() { toast.remove(); }, 400);
  }, 4000);
})();`;

  // Minify into single-line URI for javascript: bookmarklet
  const minified = rawScript
    .replace(/\/\/.*/g, "") // remove comments
    .replace(/\s+/g, " ") // collapse whitespaces
    .trim();

  const bookmarkletHref = `javascript:${encodeURIComponent(minified)}`;

  return { bookmarkletHref, rawScript };
}

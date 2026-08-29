// Muavin Content Script (Manifest V3)
(function () {
  const currentHost = window.location.hostname;
  const currentUrl = window.location.href;

  console.log("⚡ Muavin E-İşlem Asistanı yüklendi. Sayfa:", currentHost);

  // ==========================================
  // 1. MUAVIN WEB UYGULAMASI ENTEGRASYONU
  // ==========================================
  if (
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost.includes("muavin")
  ) {
    // Eklentinin kurulu olduğunu web sayfasına bildir
    window.__MUAVIN_EXTENSION_INSTALLED__ = true;
    document.documentElement.setAttribute("data-muavin-extension", "true");

    window.dispatchEvent(
      new CustomEvent("MUAVIN_EXTENSION_READY", {
        detail: { version: "1.0.0", active: true },
      })
    );

    // Web sayfasından gelen şifre ve veri senkronizasyon mesajlarını dinle
    window.addEventListener("message", (event) => {
      if (!event.data) return;

      if (event.data.type === "MUAVIN_SYNC_CREDENTIALS") {
        chrome.runtime.sendMessage(
          {
            action: "SYNC_CREDENTIALS",
            payload: event.data.payload,
          },
          (response) => {
            window.postMessage(
              { type: "MUAVIN_SYNC_CREDENTIALS_ACK", success: response?.success },
              "*"
            );
          }
        );
      }

      if (event.data.type === "MUAVIN_LAUNCH_PORTAL") {
        chrome.runtime.sendMessage({
          action: "OPEN_PORTAL_AND_FILL",
          portalUrl: event.data.portalUrl,
          portalType: event.data.portalType,
          workplaceId: event.data.workplaceId,
        });
      }
    });

    return;
  }

  // ==========================================
  // 2. RESMİ DEVLET PORTALLARI ENTEGRASYONU
  // ==========================================
  // Şirket şifrelerini background storage'dan çek
  chrome.runtime.sendMessage({ action: "GET_CREDENTIALS" }, (response) => {
    if (!response || !response.companyData) {
      console.log("⚠️ Muavin: Senkronize edilmiş şirket şifresi bulunamadı. Lütfen önce Muavin uygulamasını açın.");
      renderFloatingWidget(null);
      return;
    }

    const company = response.companyData;
    console.log("✅ Muavin: Aktif şirket şifreleri hazır:", company.companyName);

    renderFloatingWidget(company);

    // Sayfa yeni açıldığında otomatik doldurmayı dene
    setTimeout(() => {
      autoFillPortal(company, false);
    }, 800);
  });

  // Otomatik Alan Doldurucu
  function fillField(selectors, value) {
    if (!value) return false;
    for (let i = 0; i < selectors.length; i++) {
      const el = document.querySelector(selectors[i]);
      if (el && el.offsetParent !== null) { // Görünür mü kontrol et
        el.value = value;
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

  function autoFillPortal(company, userClicked = false) {
    let filledCount = 0;

    // GİB Dijital / İVD / e-Arşiv Seçicileri
    if (fillField(['input[name="kullaniciKodu"]', 'input[id*="kullanici"]', 'input[name="username"]', 'input[name="userid"]', '#userid', '#kullaniciKodu'], company.taxCredentials?.userCode || company.taxNumber)) filledCount++;
    if (fillField(['input[name="parola"]', 'input[id*="parola"]', 'input[name="password"]', '#password', '#parola', 'input[type="password"]'], company.taxCredentials?.password)) filledCount++;
    if (fillField(['input[name="sifre"]', 'input[id*="sifre"]', 'input[name="codeSecret"]', '#sifre', '#codeSecret'], company.taxCredentials?.codeSecret)) filledCount++;

    // SGK İşveren & e-Bildirge Seçicileri
    const activeWp = company.sgkCredentials?.workplaces?.[0] || company.sgkCredentials || {};
    if (fillField(['input[name="kullaniciKodu"]', '#kullaniciKodu'], activeWp.userCode || company.sgkCredentials?.userCode)) filledCount++;
    if (fillField(['input[name="isyeriKodu"]', '#isyeriKodu'], activeWp.workplaceCode || "000")) filledCount++;
    if (fillField(['input[name="sistemSifresi"]', '#sistemSifresi'], activeWp.systemPassword || company.sgkCredentials?.systemPassword)) filledCount++;
    if (fillField(['input[name="isyeriSifresi"]', '#isyeriSifresi'], activeWp.workplacePassword || company.sgkCredentials?.workplacePassword)) filledCount++;
    if (fillField(['input[name="isyeriSicil"]', '#isyeriSicil'], activeWp.workplaceRegistrationNo)) filledCount++;

    // e-Devlet Kapısı Seçicileri
    if (fillField(['#tridfield', 'input[name="tridfield"]', 'input[id*="trid"]'], company.eDevletCredentials?.tckn || company.taxNumber)) filledCount++;
    if (fillField(['#egpField', 'input[name="egpField"]', 'input[id*="egp"]'], company.eDevletCredentials?.password)) filledCount++;

    // MERSİS Seçicileri
    if (fillField(['#UserName', 'input[name="UserName"]'], company.taxCredentials?.userCode)) filledCount++;
    if (fillField(['#Password', 'input[name="Password"]'], company.taxCredentials?.password)) filledCount++;

    // Güvenlik Kodu / CAPTCHA Kutusuna Odaklan
    const captcha = document.querySelector('input[name*="guvenlik"], input[id*="captcha"], input[name*="captcha"], input[id*="guvenlik"]');
    if (captcha) {
      captcha.focus();
      captcha.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.4)";
    }

    // Floating Bar Durumunu Güncelle
    const statusText = document.getElementById("muavin-widget-status");
    if (statusText) {
      if (filledCount > 0) {
        statusText.innerHTML = `✅ ${filledCount} Alan Dolduruldu`;
        statusText.style.color = "#34d399";
      } else if (userClicked) {
        statusText.innerHTML = `⚠️ Form alanı bulunamadı`;
        statusText.style.color = "#fbbf24";
      }
    }
  }

  // Floating Widget Oluşturucu
  function renderFloatingWidget(company) {
    if (document.getElementById("muavin-floating-root")) return;

    const root = document.createElement("div");
    root.id = "muavin-floating-root";
    root.style.position = "fixed";
    root.style.bottom = "20px";
    root.style.right = "20px";
    root.style.zIndex = "2147483647";
    root.style.fontFamily = "system-ui, -apple-system, sans-serif";
    root.style.boxShadow = "0 10px 30px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)";
    root.style.background = "#0f172a";
    root.style.color = "#f8fafc";
    root.style.padding = "12px 16px";
    root.style.borderRadius = "18px";
    root.style.display = "flex";
    root.style.alignItems = "center";
    root.style.gap = "12px";
    root.style.backdropFilter = "blur(12px)";
    root.style.border = "1px solid #1e293b";
    root.style.transition = "all 0.2s ease";

    if (!company) {
      root.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">⚡</span>
          <div>
            <div style="font-size:12px;font-weight:800;color:#f8fafc;">Muavin Eklentisi</div>
            <div style="font-size:10px;color:#94a3b8;">Muavin'i açarak şifreleri eşleyin</div>
          </div>
        </div>
      `;
      document.body.appendChild(root);
      return;
    }

    const companyTitle = company.companyName || "Şirketim";
    const vkn = company.taxNumber ? `(VKN: ${company.taxNumber})` : "";

    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg, #10b981, #0d9488);display:flex;align-items:center;justify-content:center;color:#0f172a;font-weight:900;font-size:16px;">
          ⚡
        </div>
        <div>
          <div style="font-size:12px;font-weight:800;color:#ffffff;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${companyTitle}
          </div>
          <div id="muavin-widget-status" style="font-size:10px;font-weight:700;color:#34d399;">
            Muavin ile Bağlı ${vkn}
          </div>
        </div>
      </div>

      <button id="muavin-btn-autofill" style="background:#10b981;color:#0f172a;border:none;padding:7px 14px;border-radius:10px;font-size:11px;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:5px;transition:background 0.2s;">
        <span>Doldur</span> ⚡
      </button>
    `;

    document.body.appendChild(root);

    const btn = document.getElementById("muavin-btn-autofill");
    if (btn) {
      btn.addEventListener("click", () => {
        autoFillPortal(company, true);
      });
      btn.addEventListener("mouseenter", () => (btn.style.background = "#34d399"));
      btn.addEventListener("mouseleave", () => (btn.style.background = "#10b981"));
    }
  }
})();

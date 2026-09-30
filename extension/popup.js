// Muavin Extension Popup Logic
document.addEventListener("DOMContentLoaded", () => {
  const companyNameEl = document.getElementById("company-name");
  const companyVknEl = document.getElementById("company-vkn");
  const statusBadgeEl = document.getElementById("status-badge");
  const lastSyncedEl = document.getElementById("last-synced");
  const btnOpenMuavin = document.getElementById("btn-open-muavin");
  const btnSync = document.getElementById("btn-sync");

  function loadCompanyInfo() {
    chrome.storage.local.get(["companyData", "lastSynced"], (result) => {
      const company = result.companyData;
      if (company && company.companyName) {
        companyNameEl.textContent = company.companyName;
        companyVknEl.textContent = `VKN / TCKN: ${company.taxNumber || "—"}`;
        statusBadgeEl.textContent = "🟢 Eşlendi";
        statusBadgeEl.className = "badge-status";
        
        if (result.lastSynced) {
          const date = new Date(result.lastSynced);
          lastSyncedEl.textContent = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        }
      } else {
        companyNameEl.textContent = "Senkronizasyon Bekleniyor";
        companyVknEl.textContent = "Muavin uygulamasından şifreleri eşleyin";
        statusBadgeEl.textContent = "⚪ Bağlantı Yok";
        statusBadgeEl.className = "badge-status inactive";
        lastSyncedEl.textContent = "—";
      }
    });
  }

  loadCompanyInfo();

  // Portal launcher buttons
  document.querySelectorAll(".portal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      const type = btn.getAttribute("data-type");

      if (url) {
        chrome.runtime.sendMessage({
          action: "OPEN_PORTAL_AND_FILL",
          portalUrl: url,
          portalType: type,
        });
      }
    });
  });

  // Open Muavin button
  btnOpenMuavin.addEventListener("click", () => {
    chrome.tabs.query({ url: ["http://localhost:*/*", "http://127.0.0.1:*/*", "https://*.muavin.com/*"] }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        chrome.tabs.create({ url: "http://localhost:3000" });
      }
    });
  });

  // Sync button (tries fetching from localhost:3000 API)
  btnSync.addEventListener("click", async () => {
    statusBadgeEl.textContent = "🔄 Eşleniyor...";
    try {
      const res = await fetch("http://127.0.0.1:3000/api/extension/credentials");
      const json = await res.json();
      if (json.success && json.data) {
        chrome.storage.local.set(
          {
            companyData: json.data,
            lastSynced: new Date().toISOString(),
          },
          () => {
            loadCompanyInfo();
          }
        );
      } else {
        alert("Muavin'e bağlanılamadı. Lütfen Muavin uygulamasının açık olduğundan emin olun.");
        loadCompanyInfo();
      }
    } catch (err) {
      alert("Muavin sunucusuna erişilemedi (http://127.0.0.1:3000).");
      loadCompanyInfo();
    }
  });
});

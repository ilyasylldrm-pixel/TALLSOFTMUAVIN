// Muavin Extension Popup Logic (Manifest V3)
document.addEventListener("DOMContentLoaded", () => {
  // Views
  const viewLogin = document.getElementById("view-login");
  const viewDashboard = document.getElementById("view-dashboard");

  // Login form elements
  const formLogin = document.getElementById("form-login");
  const inputEmail = document.getElementById("input-email");
  const inputPassword = document.getElementById("input-password");
  const inputServer = document.getElementById("input-server");
  const btnTogglePassword = document.getElementById("btn-toggle-password");
  const loginError = document.getElementById("login-error");
  const btnLogin = document.getElementById("btn-login");
  const btnLoginText = document.getElementById("btn-login-text");
  const btnLoginSpinner = document.getElementById("btn-login-spinner");

  // Dashboard elements
  const companyNameEl = document.getElementById("company-name");
  const companyVknEl = document.getElementById("company-vkn");
  const statusBadgeEl = document.getElementById("status-badge");
  const userDisplayEl = document.getElementById("user-display");
  const workplaceContainer = document.getElementById("workplace-container");
  const selectWorkplace = document.getElementById("select-workplace");
  const btnOpenMuavin = document.getElementById("btn-open-muavin");
  const btnSync = document.getElementById("btn-sync");
  const btnLogout = document.getElementById("btn-logout");

  // Server chip buttons
  document.querySelectorAll(".server-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const url = chip.getAttribute("data-url");
      if (url && inputServer) {
        inputServer.value = url;
      }
    });
  });

  // Password toggle
  if (btnTogglePassword && inputPassword) {
    btnTogglePassword.addEventListener("click", () => {
      if (inputPassword.type === "password") {
        inputPassword.type = "text";
        btnTogglePassword.textContent = "Gizle";
      } else {
        inputPassword.type = "password";
        btnTogglePassword.textContent = "Göster";
      }
    });
  }

  // Check login state on open
  function checkSession() {
    chrome.storage.local.get(
      ["authToken", "user", "companyData", "lastSynced", "serverUrl", "selectedWpId"],
      (res) => {
        if (res.authToken && res.companyData) {
          showDashboard(res);
        } else {
          showLogin(res.serverUrl || "https://tallsoft.org");
        }
      }
    );
  }

  function showLogin(defaultServer) {
    if (viewLogin) viewLogin.style.display = "flex";
    if (viewDashboard) viewDashboard.style.display = "none";
    if (inputServer && defaultServer) inputServer.value = defaultServer;
  }

  function showDashboard(data) {
    if (viewLogin) viewLogin.style.display = "none";
    if (viewDashboard) viewDashboard.style.display = "flex";

    const company = data.companyData || {};
    companyNameEl.textContent = company.companyTitle || company.companyName || "Şirketim";
    companyVknEl.textContent = `VKN / TCKN: ${company.taxNumber || "—"}`;

    if (data.user && data.user.email) {
      userDisplayEl.textContent = `👤 ${data.user.email.split("@")[0]}`;
      userDisplayEl.title = data.user.email;
    }

    statusBadgeEl.textContent = "🟢 Bağlandı";
    statusBadgeEl.className = "badge-status";

    // Populate SGK Workplaces if available
    const workplaces =
      company.sgkCredentials?.workplaces && Array.isArray(company.sgkCredentials.workplaces)
        ? company.sgkCredentials.workplaces
        : [];

    if (workplaces.length > 1 && workplaceContainer && selectWorkplace) {
      workplaceContainer.style.display = "flex";
      selectWorkplace.innerHTML = "";
      workplaces.forEach((wp) => {
        const opt = document.createElement("option");
        opt.value = wp.id;
        opt.textContent = `${wp.name} (${wp.workplaceCode || "000"})`;
        if (data.selectedWpId === wp.id) opt.selected = true;
        selectWorkplace.appendChild(opt);
      });

      selectWorkplace.onchange = (e) => {
        chrome.storage.local.set({ selectedWpId: e.target.value });
      };
    } else if (workplaceContainer) {
      workplaceContainer.style.display = "none";
    }
  }

  // Handle Login Form Submit
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginError.style.display = "none";
      btnLogin.disabled = true;
      btnLoginText.textContent = "Bağlanıyor...";
      btnLoginSpinner.style.display = "inline-block";

      const email = inputEmail.value.trim();
      const password = inputPassword.value;
      const serverUrl = (inputServer.value || "https://tallsoft.org").trim().replace(/\/$/, "");

      try {
        const response = await fetch(`${serverUrl}/api/extension/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const json = await response.json();

        if (json.success && json.companyData) {
          const sessionData = {
            authToken: json.token || `ext_auth_${Date.now()}`,
            user: json.user || { email },
            companyData: json.companyData,
            serverUrl: serverUrl,
            lastSynced: new Date().toISOString(),
          };

          chrome.storage.local.set(sessionData, () => {
            showDashboard(sessionData);
          });
        } else {
          loginError.textContent = json.error || "Giriş yapılamadı. Bilgilerinizi kontrol edin.";
          loginError.style.display = "block";
        }
      } catch (err) {
        console.warn("Login request error:", err);
        loginError.textContent = `Sunucuya bağlanılamadı (${serverUrl}). Lütfen sunucunun açık olduğundan emin olun.`;
        loginError.style.display = "block";
      } finally {
        btnLogin.disabled = false;
        btnLoginText.textContent = "🚀 Giriş Yap ve Şifreleri Çek";
        btnLoginSpinner.style.display = "none";
      }
    });
  }

  // Portal launcher buttons
  document.querySelectorAll(".portal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      const type = btn.getAttribute("data-type");

      chrome.storage.local.get(["selectedWpId"], (res) => {
        if (url) {
          chrome.runtime.sendMessage({
            action: "OPEN_PORTAL_AND_FILL",
            portalUrl: url,
            portalType: type,
            workplaceId: res.selectedWpId,
          });
        }
      });
    });
  });

  // Re-sync credentials from Tallsoft API
  if (btnSync) {
    btnSync.addEventListener("click", async () => {
      statusBadgeEl.textContent = "🔄 Yenileniyor...";
      chrome.storage.local.get(["serverUrl", "authToken"], async (res) => {
        const serverUrl = res.serverUrl || "https://tallsoft.org";
        try {
          const apiRes = await fetch(`${serverUrl}/api/extension/credentials`, {
            headers: res.authToken ? { Authorization: `Bearer ${res.authToken}` } : {},
          });
          const json = await apiRes.json();
          if (json.success && json.data) {
            chrome.storage.local.set(
              {
                companyData: json.data,
                lastSynced: new Date().toISOString(),
              },
              () => {
                checkSession();
              }
            );
          } else {
            alert("Şifreler yenilenemedi: " + (json.error || "Bilinmeyen hata"));
            checkSession();
          }
        } catch (err) {
          alert(`Sunucuya erişilemedi: ${serverUrl}`);
          checkSession();
        }
      });
    });
  }

  // Logout button
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Oturumu kapatmak ve kayıtlı şifreleri temizlemek istediğinize emin misiniz?")) {
        chrome.storage.local.remove(
          ["authToken", "user", "companyData", "lastSynced", "selectedWpId"],
          () => {
            checkSession();
          }
        );
      }
    });
  }

  // Open Tallsoft Web button
  if (btnOpenMuavin) {
    btnOpenMuavin.addEventListener("click", () => {
      chrome.storage.local.get(["serverUrl"], (res) => {
        const targetUrl = res.serverUrl || "https://tallsoft.org";
        chrome.tabs.query({ url: ["http://localhost:*/*", "https://*.tallsoft.org/*", "https://tallsoft.org/*"] }, (tabs) => {
          if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
          } else {
            chrome.tabs.create({ url: targetUrl });
          }
        });
      });
    });
  }

  // Init
  checkSession();
});


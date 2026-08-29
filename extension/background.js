// Muavin Extension Background Service Worker (Manifest V3)
console.log("⚡ Muavin E-İşlem Asistanı background worker aktif.");

// Listen for messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SYNC_CREDENTIALS") {
    // Store latest company credentials
    chrome.storage.local.set(
      {
        companyData: request.payload,
        lastSynced: new Date().toISOString(),
      },
      () => {
        console.log("✅ Şirket şifreleri eklentiye senkronize edildi:", request.payload?.companyName);
        sendResponse({ success: true, timestamp: Date.now() });
      }
    );
    return true;
  }

  if (request.action === "GET_CREDENTIALS") {
    chrome.storage.local.get(["companyData", "lastSynced"], (result) => {
      sendResponse({
        success: true,
        companyData: result.companyData || null,
        lastSynced: result.lastSynced || null,
      });
    });
    return true;
  }

  if (request.action === "OPEN_PORTAL_AND_FILL") {
    const { portalUrl, portalType, workplaceId } = request;
    chrome.tabs.create({ url: portalUrl }, (tab) => {
      if (tab.id) {
        // Set a pending autofill task for this tab
        chrome.storage.local.set({
          [`pending_autofill_${tab.id}`]: {
            portalType,
            workplaceId,
            timestamp: Date.now(),
          },
        });
      }
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }
});

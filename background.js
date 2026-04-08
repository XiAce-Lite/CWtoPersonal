const DEFAULTS = {
  personalTopUrl: ""
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    if (chrome.runtime.lastError) {
      console.warn("[cw2p] Failed to read initial settings:", chrome.runtime.lastError.message);
      return;
    }

    if (typeof items.personalTopUrl !== "string") {
      chrome.storage.sync.set(DEFAULTS);
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "OPEN_PERSONAL_TOP") {
    return;
  }

  chrome.storage.sync.get(DEFAULTS, (items) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        ok: false,
        error: "設定の読み込みに失敗しました。"
      });
      return;
    }

    const personalTopUrl = String(items.personalTopUrl || "").trim();
    if (!personalTopUrl) {
      sendResponse({
        ok: false,
        error: "options_page で personalTopUrl を設定してください。"
      });
      return;
    }

    let url;
    try {
      url = new URL(personalTopUrl);
      if (!/^https?:$/.test(url.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch (_error) {
      sendResponse({
        ok: false,
        error: "personalTopUrl の形式が不正です。"
      });
      return;
    }

    chrome.tabs.create({ url: url.toString(), active: true }, (tab) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          error: `タブを開けませんでした: ${chrome.runtime.lastError.message}`
        });
        return;
      }

      sendResponse({
        ok: true,
        url: url.toString(),
        tabId: tab?.id ?? null
      });
    });
  });

  return true;
});

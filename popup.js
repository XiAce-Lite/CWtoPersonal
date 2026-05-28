const extensionEnabledInput = document.getElementById('extensionEnabled');
const openOptionsButton = document.getElementById('openOptions');
const status = document.getElementById('status');

function setStatus(message, type = 'success') {
  status.textContent = message;
  status.style.color = type === 'error' ? '#b91c1c' : '#166534';
}

function loadPopupState() {
  chrome.storage.sync.get({ extensionEnabled: true }, (items) => {
    if (chrome.runtime.lastError) {
      setStatus('設定の読み込みに失敗しました。', 'error');
      return;
    }
    extensionEnabledInput.checked = items.extensionEnabled !== false;
  });
}

function saveEnabledState() {
  chrome.storage.sync.set({ extensionEnabled: extensionEnabledInput.checked }, () => {
    if (chrome.runtime.lastError) {
      setStatus('保存に失敗しました。', 'error');
      return;
    }
    setStatus(extensionEnabledInput.checked ? '機能を有効にしました。' : '機能を無効にしました。');
  });
}

function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
    return;
  }
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

document.addEventListener('DOMContentLoaded', loadPopupState);
extensionEnabledInput.addEventListener('change', saveEnabledState);
openOptionsButton.addEventListener('click', openOptionsPage);

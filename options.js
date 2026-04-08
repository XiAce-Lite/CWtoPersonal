const personalTopUrlInput = document.getElementById('personalTopUrl');
const closeOriginalTabInput = document.getElementById('closeOriginalTab');
const saveButton = document.getElementById('saveButton');
const status = document.getElementById('status');

function setStatus(message, type = 'info') {
  status.textContent = message;
  status.style.color = type === 'error' ? '#b91c1c' : '#166534';
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol);
  } catch (_error) {
    return false;
  }
}

function loadOptions() {
  chrome.storage.sync.get({ personalTopUrl: '', closeOriginalTab: true }, (items) => {
    if (chrome.runtime.lastError) {
      setStatus('設定の読み込みに失敗しました。', 'error');
      return;
    }

    personalTopUrlInput.value = items.personalTopUrl || '';
    closeOriginalTabInput.checked = items.closeOriginalTab !== false;
  });
}

function saveOptions() {
  const value = personalTopUrlInput.value.trim();
  const closeOriginalTab = closeOriginalTabInput.checked;

  if (value && !isValidHttpUrl(value)) {
    setStatus('http(s) 形式のURLを入力してください。', 'error');
    personalTopUrlInput.focus();
    return;
  }

  chrome.storage.sync.set({ personalTopUrl: value, closeOriginalTab }, () => {
    if (chrome.runtime.lastError) {
      setStatus('保存に失敗しました。', 'error');
      return;
    }

    setStatus('保存しました。', 'success');
  });
}

document.addEventListener('DOMContentLoaded', loadOptions);
saveButton.addEventListener('click', saveOptions);
personalTopUrlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    saveOptions();
  }
});

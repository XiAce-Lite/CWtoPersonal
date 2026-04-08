(() => {
  const PENDING_KEY = "cw2p_pending";
  const BUTTON_ID = "cw2p-floating-button";
  const TOAST_ROOT_ID = "cw2p-toast-root";

  function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);
    if (root) {
      return root;
    }

    root = document.createElement("div");
    root.id = TOAST_ROOT_ID;
    Object.assign(root.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: "2147483647",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none",
      maxWidth: "320px"
    });
    (document.body || document.documentElement).appendChild(root);
    return root;
  }

  function toast(message, type = "info", timeoutMs = 2500) {
    const root = ensureToastRoot();
    const node = document.createElement("div");
    const palette = {
      info: { bg: "#1f2937", border: "#60a5fa" },
      success: { bg: "#14532d", border: "#4ade80" },
      error: { bg: "#7f1d1d", border: "#f87171" }
    };
    const colors = palette[type] || palette.info;

    node.textContent = message;
    Object.assign(node.style, {
      background: colors.bg,
      color: "#ffffff",
      borderLeft: `4px solid ${colors.border}`,
      borderRadius: "8px",
      padding: "10px 12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      fontSize: "13px",
      lineHeight: "1.4",
      opacity: "0",
      transform: "translateY(-6px)",
      transition: "opacity 160ms ease, transform 160ms ease",
      pointerEvents: "auto"
    });

    root.appendChild(node);
    requestAnimationFrame(() => {
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
    });

    window.setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(-6px)";
      window.setTimeout(() => node.remove(), 180);
    }, timeoutMs);
  }

  function isVisible(element) {
    return !!(element && element.offsetParent !== null);
  }

  function looksLikeEditHref(href) {
    if (!href) {
      return false;
    }

    const normalized = href.toLowerCase();
    return (
      normalized.includes("edit") ||
      /[?&](action|mode|cmd|do|c)=e(dit)?\b/.test(normalized)
    );
  }

  function findEditLink() {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    let best = null;
    let bestScore = -1;

    for (const anchor of anchors) {
      const href = anchor.getAttribute('href') || '';
      const text = `${anchor.textContent || ''} ${anchor.title || ''} ${anchor.getAttribute('aria-label') || ''}`.toLowerCase();
      let score = 0;

      if (looksLikeEditHref(href)) {
        score += 8;
      }
      if (/編集|edit/.test(text)) {
        score += 6;
      }
      if (isVisible(anchor)) {
        score += 2;
      }

      if (score > bestScore) {
        best = anchor;
        bestScore = score;
      }
    }

    return bestScore > 0 ? best : null;
  }

  function isEditPage() {
    const current = `${location.pathname}${location.search}`.toLowerCase();
    if (
      /\/edit(?:\/|$)/.test(current) ||
      /[?&](action|mode|cmd|do|c)=e(dit)?\b/.test(current)
    ) {
      return true;
    }

    const prioritized = document.querySelector(
      'textarea[name="msg"], textarea[name="text"], textarea[name="source"], textarea#msg, textarea#text'
    );
    if (prioritized && isVisible(prioritized) && !prioritized.disabled && !prioritized.readOnly) {
      return true;
    }

    const visibleTextareas = Array.from(document.querySelectorAll('textarea')).filter(
      (textarea) => isVisible(textarea) && !textarea.disabled && !textarea.readOnly
    );
    return visibleTextareas.some((textarea) => {
      const rows = Number(textarea.getAttribute('rows') || textarea.rows || 0);
      return rows >= 10 || (textarea.value || '').length >= 120;
    });
  }

  function injectFloatingButton() {
    if (document.getElementById(BUTTON_ID) || isEditPage()) {
      return;
    }

    const editLink = findEditLink();
    if (!editLink) {
      return;
    }

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = 'CW → Personal';
    button.setAttribute('aria-label', 'ChordWiki から chordwiki_personal へコピー準備');
    Object.assign(button.style, {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: '2147483646',
      background: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: '999px',
      padding: '9px 12px',
      fontSize: '12px',
      fontWeight: '700',
      boxShadow: '0 10px 24px rgba(37,99,235,0.28)',
      cursor: 'pointer'
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = '#1d4ed8';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#2563eb';
    });

    button.addEventListener('click', () => {
      const targetLink = findEditLink();
      const href = targetLink?.href;
      if (!href) {
        toast('編集リンクが見つかりませんでした。', 'error');
        return;
      }

      sessionStorage.setItem(PENDING_KEY, '1');
      toast('編集ページへ移動しています…', 'info', 1800);
      window.setTimeout(() => {
        window.location.assign(href);
      }, 120);
    });

    (document.body || document.documentElement).appendChild(button);
  }

  function findChordProTextarea() {
    const candidateSelectors = [
      'textarea[name="msg"]',
      'textarea[name="text"]',
      'textarea[name="source"]',
      'textarea#msg',
      'textarea#text'
    ];

    for (const selector of candidateSelectors) {
      const candidate = document.querySelector(selector);
      if (candidate && isVisible(candidate) && !candidate.disabled && !candidate.readOnly) {
        return candidate;
      }
    }

    const allTextareas = Array.from(document.querySelectorAll('textarea'));
    let best = null;
    let bestScore = -1;

    for (const textarea of allTextareas) {
      if (!isVisible(textarea) || textarea.disabled || textarea.readOnly) {
        continue;
      }

      let score = 0;
      if (textarea.closest('form')) {
        score += 20;
      }

      const hintText = `${textarea.name || ''} ${textarea.id || ''}`.toLowerCase();
      if (/(msg|text|source|body|data|content|chord)/.test(hintText)) {
        score += 25;
      }

      const rows = Number(textarea.getAttribute('rows') || textarea.rows || 0);
      score += Math.min(rows, 30);

      const valueLength = (textarea.value || '').length;
      score += Math.min(Math.floor(valueLength / 80), 30);

      if (score > bestScore) {
        best = textarea;
        bestScore = score;
      }
    }

    return best;
  }

  async function waitForChordProTextarea(timeoutMs = 8000, intervalMs = 250) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const textarea = findChordProTextarea();
      if (textarea) {
        return textarea;
      }
      await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
    }
    return null;
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (_error) {
        // Fallback below.
      }
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', 'readonly');
    Object.assign(helper.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      opacity: '0'
    });

    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, helper.value.length);

    const copied = document.execCommand('copy');
    helper.remove();

    if (!copied) {
      throw new Error('Clipboard copy failed');
    }
  }

  function openPersonalTopTab() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'OPEN_PERSONAL_TOP' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || '新規タブを開けませんでした。'));
          return;
        }
        resolve(response);
      });
    });
  }

  function getCloseOriginalTabSetting() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ closeOriginalTab: true }, (items) => {
        if (chrome.runtime.lastError) {
          console.warn('[cw2p] Failed to read closeOriginalTab:', chrome.runtime.lastError.message);
          resolve(true);
          return;
        }

        resolve(items.closeOriginalTab !== false);
      });
    });
  }

  function closeCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'CLOSE_SENDER_TAB' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || '元のタブを閉じられませんでした。'));
          return;
        }
        resolve(response);
      });
    });
  }

  async function handlePendingFlow() {
    if (sessionStorage.getItem(PENDING_KEY) !== '1') {
      return;
    }

    toast('ChordPro本文を確認しています…', 'info');

    try {
      const textarea = await waitForChordProTextarea();
      if (!textarea) {
        toast('編集用 textarea が見つかりませんでした。', 'error', 3200);
        return;
      }

      const text = textarea.value || '';
      if (!text.trim()) {
        toast('本文が空のためコピーできませんでした。', 'error', 3200);
        return;
      }

      await copyTextToClipboard(text);
      toast('ChordPro本文をクリップボードへコピーしました。', 'success');

      const shouldCloseOriginalTab = await getCloseOriginalTabSetting();
      await openPersonalTopTab();

      if (shouldCloseOriginalTab) {
        toast('chordwiki_personal を開きました。元のタブを閉じます…', 'success', 1200);
        window.setTimeout(() => {
          void closeCurrentTab().catch(() => {
            // Closing may fail if the tab is already gone; no further UI is needed here.
          });
        }, 500);
      } else {
        toast('chordwiki_personal を開きました。元のタブは開いたままです。', 'success', 2200);
      }
    } catch (error) {
      toast(error?.message || '処理中にエラーが発生しました。', 'error', 3500);
    } finally {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectFloatingButton();
      void handlePendingFlow();
    }, { once: true });
  } else {
    injectFloatingButton();
    void handlePendingFlow();
  }
})();

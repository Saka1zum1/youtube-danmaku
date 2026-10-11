function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSvg(markup) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const viewBox = markup.match(/\bviewBox="([^"]*)"/i);
  if (viewBox) svg.setAttribute('viewBox', viewBox[1]);
  svg.setAttribute('aria-hidden', 'true');

  const tags = markup.match(/<(?:path|circle|rect|polygon)\b[^>]*\/?>/gi) || [];
  for (const tag of tags) {
    const name = tag.match(/^<([\w:-]+)/)[1];
    const shape = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const attr of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
      shape.setAttribute(attr[1], attr[2]);
    }
    svg.appendChild(shape);
  }
  return svg;
}

function appendMarkup(parent, markup) {
  const parts = markup.match(/<span\b[^>]*>[\s\S]*?<\/span>|<svg\b[\s\S]*?<\/svg>/gi) || [];
  for (const part of parts) {
    if (/^<span/i.test(part)) {
      const span = document.createElement('span');
      const className = part.match(/\bclass="([^"]*)"/i);
      if (className) span.className = className[1];
      const svgMarkup = part.match(/<svg\b[\s\S]*?<\/svg>/i);
      if (svgMarkup) span.appendChild(createSvg(svgMarkup[0]));
      parent.appendChild(span);
      continue;
    }
    parent.appendChild(createSvg(part));
  }
}

function waitForElement(selector, root = document, timeout = 30000) {
  return new Promise((resolve) => {
    const existing = root.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    if (timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    }
  });
}

function getFullscreenElement() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || null;
}

function getDanmakuMount(item) {
  return item.closest('.ydm-danmaku-layer')?.parentElement || null;
}

function getPlayerElement() {
  return document.querySelector(SELECTORS.player);
}

function getChatDocument() {
  const iframe = document.querySelector(SELECTORS.chatFrame);
  if (iframe) {
    try {
      const doc = iframe.contentDocument;
      if (doc?.querySelector(SELECTORS.chatItems)) return doc;
    } catch (_) {
      return null;
    }
    return null;
  }

  const host = document.querySelector(SELECTORS.chatHost);
  if (host?.querySelector(SELECTORS.chatItems)) return document;
  return null;
}

async function waitForChatList(shouldAbort, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (shouldAbort?.()) return null;
    const list = getChatDocument()?.querySelector(SELECTORS.chatItems) || null;
    if (list) return list;
    await delay(300);
  }
  return null;
}

function isNeutralColor(color) {
  const match = String(color).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) return false;
  const channels = match.slice(1, 4).map(Number);
  return Math.max(...channels) - Math.min(...channels) < 24;
}

function colorFromName(name) {
  const text = name || '?';
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return NAME_COLORS[(hash >>> 0) % NAME_COLORS.length];
}

function safeCssColor(color) {
  const value = String(color || '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (/^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value)) {
    return value;
  }
  return '#ffffff';
}

function getUsernameColor(msgEl, username) {
  const type = (msgEl.getAttribute('author-type') || '').toLowerCase();
  if (type === 'owner') return '#ffd600';
  if (type === 'moderator') return '#5e84f1';

  const nameEl = msgEl.querySelector('#author-name');
  if (nameEl) {
    const color = getComputedStyle(nameEl).color;
    if (color && !isNeutralColor(color)) return color;
  }
  return colorFromName(username);
}

function getYouTubeProfileUrl(msgEl) {
  const anchor = msgEl.querySelector('a[href*="/channel/"], a[href*="/@"], a[href*="youtube.com/"]');
  const href = anchor?.getAttribute('href');
  if (href && !href.startsWith('javascript:')) {
    try {
      const url = new URL(href, 'https://www.youtube.com');
      if (url.protocol === 'https:' && /(^|\.)youtube\.com$/.test(url.hostname)) {
        return url.href;
      }
    } catch (_) {
      /* ignore */
    }
  }
  return null;
}

function isWatchPage() {
  if (document.documentElement.dataset.ydmPreview === 'true') return true;
  const path = location.pathname;
  return path === '/watch' || /^\/live\/[^/]+/.test(path);
}

function pageKey() {
  if (!isWatchPage()) return '';
  if (document.documentElement.dataset.ydmPreview === 'true') return 'preview';
  const videoId = new URLSearchParams(location.search).get('v');
  if (videoId) return videoId;
  const live = location.pathname.match(/^\/live\/([^/]+)/);
  return live ? live[1] : location.pathname;
}

async function copyTextToClipboard(text) {
  if (!text) return false;

  if (typeof GM_setClipboard === 'function') {
    try {
      GM_setClipboard(text, 'text');
      return true;
    } catch (_) {
      /* ignore */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

async function setChatInputText(text) {
  if (!text) return false;

  const doc = getChatDocument();
  const win = doc?.defaultView;
  const input = doc?.querySelector(SELECTORS.chatInput);
  if (!doc || !win || !input) {
    return copyTextToClipboard(text);
  }

  win.focus();
  input.focus();

  const selection = win.getSelection();
  const range = doc.createRange();
  range.selectNodeContents(input);
  selection?.removeAllRanges();
  selection?.addRange(range);

  let inserted = false;
  try {
    inserted = doc.execCommand('insertText', false, text);
  } catch (_) {
    inserted = false;
  }

  const current = (input.innerText || input.textContent || '').replace(/\u00a0/g, ' ').trim();
  if (!inserted || current !== text.trim()) {
    input.innerText = text;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
    }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const endRange = doc.createRange();
  endRange.selectNodeContents(input);
  endRange.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(endRange);
  return true;
}

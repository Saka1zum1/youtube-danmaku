const EMOTE_HOST = /(^|\.)(ggpht\.com|googleusercontent\.com|ytimg\.com|youtube\.com)$/i;

function safeEmoteSrc(src) {
  if (!src) return '';
  try {
    const url = new URL(src, 'https://www.youtube.com');
    if (url.protocol !== 'https:') return '';
    if (!EMOTE_HOST.test(url.hostname)) return '';
    return url.href;
  } catch (_) {
    return '';
  }
}

function isEmoteImage(node) {
  if (node.tagName !== 'IMG') return false;
  const src = safeEmoteSrc(node.currentSrc || node.getAttribute('src'));
  if (!src) return false;
  if (node.id === 'emoji' || node.classList.contains('emoji') || node.classList.contains('small-emoji')) {
    return true;
  }
  if (node.closest('#author-photo, #author-name, yt-live-chat-author-chip')) return false;
  return !!node.closest('#message, #sticker');
}

function pushTextPart(parts, text) {
  if (!text) return;
  const last = parts[parts.length - 1];
  if (last?.type === 'text') last.text += text;
  else parts.push({ type: 'text', text });
}

function collectParts(root) {
  if (!root) return [];
  const parts = [];

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushTextPart(parts, node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const id = node.id;
    if (id === 'author-name' || id === 'timestamp' || id === 'chat-badges' || id === 'author-photo') return;

    const tag = node.tagName;
    if (tag === 'YT-LIVE-CHAT-AUTHOR-CHIP' || tag === 'YT-ICON') return;

    if (tag === 'IMG' && isEmoteImage(node)) {
      const src = safeEmoteSrc(node.currentSrc || node.getAttribute('src'));
      const alt = (node.getAttribute('alt') || node.getAttribute('shared-tooltip-text') || '').trim();
      parts.push({ type: 'emote', alt, src });
      return;
    }

    if (tag === 'IMG') {
      const alt = node.getAttribute('alt') || node.getAttribute('shared-tooltip-text') || '';
      if (alt) pushTextPart(parts, ` ${alt} `);
      return;
    }

    for (const child of node.childNodes) walk(child);
  };

  walk(root);
  return parts;
}

function partsToText(parts) {
  return parts.map((part) => (part.type === 'emote' ? (part.alt ? ` ${part.alt} ` : ' ') : part.text))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function shieldEmoteParts(parts) {
  const emotes = [];
  let text = '';
  for (const part of parts) {
    if (part.type === 'emote') {
      text += ` ⟦E${emotes.length}⟧ `;
      emotes.push(part);
    } else {
      text += part.text;
    }
  }
  return { text: text.replace(/\s+/g, ' ').trim(), emotes };
}

function restoreEmoteParts(translated, emotes) {
  if (!emotes.length) return [{ type: 'text', text: translated }];

  const parts = [];
  const pattern = /⟦E(\d+)⟧/g;
  let last = 0;
  let found = 0;
  let match = pattern.exec(translated);
  while (match) {
    const chunk = translated.slice(last, match.index);
    if (chunk) parts.push({ type: 'text', text: chunk });
    const emote = emotes[Number(match[1])];
    if (emote) {
      parts.push(emote);
      found += 1;
    }
    last = match.index + match[0].length;
    match = pattern.exec(translated);
  }
  const tail = translated.slice(last);
  if (tail) parts.push({ type: 'text', text: tail });
  if (found !== emotes.length) return null;
  return parts;
}

function readPurchaseAmount(msgEl) {
  return msgEl?.querySelector?.('#purchase-amount, #purchase-amount-chip')?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripAmountFromText(text, amount) {
  let s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (amount) {
    const exact = escapeRegExp(amount.trim());
    s = s.replace(new RegExp(`^${exact}\\s*`, 'i'), '').trim();
  }
  // Fallback: leading currency / number tokens left by translators.
  s = s.replace(/^[¥$€£₹₩￥]\s*[\d,]+(?:\.\d+)?\s*(?:[A-Z]{3})?\s*/i, '').trim();
  s = s.replace(/^[\d,]+(?:\.\d+)?\s*(?:USD|CNY|JPY|EUR|GBP|HKD|TWD|KRW|CAD|AUD)?\s*/i, '').trim();
  return s;
}

function stripAmountFromParts(parts, amount) {
  if (!Array.isArray(parts) || !parts.length) return [];
  const out = [];
  let strippedLeading = false;
  for (const part of parts) {
    if (!strippedLeading && part?.type === 'text') {
      strippedLeading = true;
      const cleaned = stripAmountFromText(part.text, amount);
      if (cleaned) out.push({ type: 'text', text: cleaned });
      continue;
    }
    out.push(part);
  }
  return out;
}

function extractMessageParts(msgEl, { includeAmount = true } = {}) {
  const parts = [];
  const amount = readPurchaseAmount(msgEl);
  if (includeAmount && amount) pushTextPart(parts, `${amount} `);

  const messageEl = msgEl.querySelector('#message');
  if (messageEl) {
    parts.push(...collectParts(messageEl));
  } else {
    const primary = collectParts(msgEl.querySelector('#header-primary-text, #primary-text'));
    const sub = collectParts(msgEl.querySelector('#header-subtext'));
    parts.push(...primary, ...sub);
    const sticker = msgEl.querySelector('#sticker img, img.yt-live-chat-paid-sticker-renderer');
    if (sticker && !parts.some((part) => part.src && part.src === safeEmoteSrc(sticker.getAttribute('src')))) {
      if (isEmoteImage(sticker)) parts.push(...collectParts(sticker));
      else pushTextPart(parts, sticker.getAttribute('alt') || '');
    }
  }

  return parts;
}

function readChatMessage(msgEl) {
  if (!msgEl || msgEl.hasAttribute('is-deleted')) return null;

  const amount = readPurchaseAmount(msgEl);
  const parts = extractMessageParts(msgEl, { includeAmount: true });
  const bodyParts = extractMessageParts(msgEl, { includeAmount: false });
  const rawMessage = partsToText(parts);
  if (!rawMessage && !parts.some((part) => part.type === 'emote')) return null;

  const message = dedupeRepeatedMessage(rawMessage) || rawMessage;
  const usernameEl = msgEl.querySelector('#author-name');
  const username = usernameEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const usernameColor = getUsernameColor(msgEl, username);
  const profileUrl = getYouTubeProfileUrl(msgEl);
  const avatarUrl = safeEmoteSrc(
    msgEl.querySelector('#author-photo img, yt-img-shadow#author-photo img')?.currentSrc
      || msgEl.querySelector('#author-photo img, yt-img-shadow#author-photo img')?.getAttribute('src')
      || '',
  );
  const superchat = msgEl.tagName === 'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER'
    || msgEl.tagName === 'YT-LIVE-CHAT-PAID-STICKER-RENDERER'
    || /PAID-MESSAGE|PAID-STICKER|TICKER-PAID/i.test(msgEl.tagName || '')
    || !!amount;

  return {
    message,
    parts,
    bodyParts,
    amount,
    username,
    usernameColor,
    profileUrl,
    avatarUrl,
    superchat,
    superchatStyle: superchat ? readSuperchatStyle(msgEl) : null,
  };
}

function parseChatMessage(msgEl) {
  if (!msgEl || msgEl.classList.contains('ydm-processed')) return null;
  const parsed = readChatMessage(msgEl);
  if (!parsed) return null;
  msgEl.classList.add('ydm-processed');
  return parsed;
}

function readCssVarColor(el, name) {
  if (!el) return '';
  try {
    return usableCssColor(getComputedStyle(el).getPropertyValue(name)?.trim());
  } catch (_) {
    return '';
  }
}

function readSuperchatStyle(msgEl) {
  const header = msgEl.querySelector('#header') || msgEl.querySelector('#card');
  const content = msgEl.querySelector('#content');
  const headerStyle = header ? getComputedStyle(header) : null;
  const contentStyle = content ? getComputedStyle(content) : null;

  const background = readCssVarColor(msgEl, '--yt-live-chat-paid-message-primary-container-color')
    || readCssVarColor(msgEl, '--yt-live-chat-paid-message-header-background-color')
    || usableCssColor(headerStyle?.backgroundColor)
    || '#e53935';
  const bodyBackground = readCssVarColor(msgEl, '--yt-live-chat-paid-message-secondary-container-color')
    || readCssVarColor(msgEl, '--yt-live-chat-paid-message-background-color')
    || usableCssColor(contentStyle?.backgroundColor)
    || background;
  const color = readCssVarColor(msgEl, '--yt-live-chat-paid-message-header-color')
    || usableCssColor(headerStyle?.color)
    || '#ffffff';
  const bodyColor = readCssVarColor(msgEl, '--yt-live-chat-paid-message-color')
    || usableCssColor(contentStyle?.color)
    || color;

  return { background, bodyBackground, color, bodyColor };
}

function usableCssColor(value) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
  return value;
}

function markExistingMessages(chatRoot) {
  chatRoot.querySelectorAll(SELECTORS.chatMessage).forEach((el) => {
    el.classList.add('ydm-processed');
  });
}

function isLiveMessage(msgEl, chatRoot) {
  const messages = chatRoot.querySelectorAll(SELECTORS.chatMessage);
  if (!messages.length) return true;

  const tailStart = Math.max(0, messages.length - LIVE_MESSAGE_TAIL);
  for (let i = tailStart; i < messages.length; i += 1) {
    const node = messages[i];
    if (node === msgEl || node.contains(msgEl) || msgEl.contains(node)) return true;
  }
  return false;
}

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

function extractMessageParts(msgEl) {
  const parts = [];
  const amount = msgEl.querySelector('#purchase-amount, #purchase-amount-chip')?.textContent?.trim();
  if (amount) pushTextPart(parts, `${amount} `);

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

function parseChatMessage(msgEl) {
  if (!msgEl || msgEl.classList.contains('ydm-processed')) return null;
  if (msgEl.hasAttribute('is-deleted')) return null;

  const parts = extractMessageParts(msgEl);
  const rawMessage = partsToText(parts);
  if (!rawMessage && !parts.some((part) => part.type === 'emote')) return null;

  const message = dedupeRepeatedMessage(rawMessage) || rawMessage;
  const usernameEl = msgEl.querySelector('#author-name');
  const username = usernameEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const usernameColor = getUsernameColor(msgEl, username);
  const profileUrl = getYouTubeProfileUrl(msgEl);

  msgEl.classList.add('ydm-processed');
  return { message, parts, username, usernameColor, profileUrl };
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

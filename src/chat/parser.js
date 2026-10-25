const EMOTE_HOST = /(^|\.)(ggpht\.com|googleusercontent\.com|ytimg\.com|youtube\.com|gstatic\.com)$/i;
const EMOTE_SHORTCODE_RE = /^:[^:\s]+:$/;
const EMOTE_SHORTCODE_ONLY_RE = /^\s*(:[^:\s]+:\s*)+$/;

function isEmoteShortcode(value) {
  return EMOTE_SHORTCODE_RE.test(String(value || '').trim());
}

/** Recover Unicode from YouTube gaming emoji URLs like emoji_u1f44f / emoji_u1f468_200d_1f4bb. */
function unicodeFromEmoteSrc(src) {
  const href = String(src || '');
  const match = href.match(/emoji_u([0-9a-f_]+)\./i);
  if (!match) return '';
  try {
    const cps = match[1].split('_').map((hex) => parseInt(hex, 16)).filter((n) => Number.isFinite(n));
    if (!cps.length) return '';
    return String.fromCodePoint(...cps);
  } catch (_) {
    return '';
  }
}

function readEmoteAlt(node) {
  const candidates = [
    node.getAttribute('alt'),
    node.getAttribute('shared-tooltip-text'),
    node.getAttribute('title'),
    node.getAttribute('aria-label'),
  ].map((value) => String(value || '').trim()).filter(Boolean);
  // Prefer real Unicode / labels over :shortcode: (other userscripts often overwrite alt).
  const unicode = candidates.find((value) => !isEmoteShortcode(value));
  return unicode || candidates[0] || '';
}

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

function readEmoteSrc(node) {
  if (!node) return '';
  const direct = safeEmoteSrc(
    node.currentSrc
    || node.getAttribute('src')
    || node.getAttribute('data-src')
    || node.getAttribute('data-thumb')
    || '',
  );
  if (direct) return direct;
  const srcset = String(node.getAttribute('srcset') || '');
  const first = srcset.split(',')[0]?.trim().split(/\s+/)[0] || '';
  return safeEmoteSrc(first);
}

function isEmoteImage(node) {
  if (node.tagName !== 'IMG') return false;
  if (node.closest('#author-photo, #author-name, yt-live-chat-author-chip')) return false;
  const src = readEmoteSrc(node);
  if (!src) return false;
  if (
    node.id === 'emoji'
    || (typeof node.id === 'string' && node.id.startsWith('emoji'))
    || node.classList.contains('emoji')
    || node.classList.contains('small-emoji')
    || node.hasAttribute('data-emoji-id')
    || node.hasAttribute('shared-tooltip-text')
  ) {
    return true;
  }
  return !!node.closest('#message, #sticker, #purchase-description');
}

function buildEmotePart(node) {
  const src = readEmoteSrc(node);
  const rawAlt = readEmoteAlt(node);
  const emoji = (!isEmoteShortcode(rawAlt) && rawAlt && !/^https?:/i.test(rawAlt))
    ? rawAlt
    : unicodeFromEmoteSrc(src);
  const shortcode = isEmoteShortcode(rawAlt)
    ? rawAlt
    : (isEmoteShortcode(node.getAttribute('shared-tooltip-text'))
      ? String(node.getAttribute('shared-tooltip-text')).trim()
      : '');
  // Display label: Unicode when possible; never prefer shortcode for rendering.
  const alt = emoji || shortcode || rawAlt || '';
  return { type: 'emote', alt, src, emoji: emoji || '', shortcode };
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
      const text = node.textContent || '';
      // Some clients / copy-fix scripts leave trailing ":shortcode:" text beside imgs.
      if (EMOTE_SHORTCODE_ONLY_RE.test(text)) return;
      pushTextPart(parts, text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const id = node.id;
    if (id === 'author-name' || id === 'timestamp' || id === 'chat-badges' || id === 'author-photo') return;

    const tag = node.tagName;
    if (tag === 'YT-LIVE-CHAT-AUTHOR-CHIP' || tag === 'YT-ICON') return;

    if (tag === 'IMG' && isEmoteImage(node)) {
      parts.push(buildEmotePart(node));
      return;
    }

    if (tag === 'IMG') {
      const alt = readEmoteAlt(node);
      if (alt && !isEmoteShortcode(alt)) pushTextPart(parts, ` ${alt} `);
      return;
    }

    for (const child of node.childNodes) walk(child);
  };

  walk(root);
  return parts;
}

function emoteDisplayText(part) {
  if (!part || part.type !== 'emote') return '';
  const emoji = String(part.emoji || '').trim() || unicodeFromEmoteSrc(part.src);
  if (emoji) return emoji;
  const alt = String(part.alt || '').trim();
  if (alt && !isEmoteShortcode(alt)) return alt;
  return '';
}

function partsToText(parts) {
  return parts.map((part) => {
    if (part.type !== 'emote') return part.text;
    const text = emoteDisplayText(part);
    return text ? text : '';
  }).join('').replace(/\s+/g, ' ').trim();
}

/** Favorites store sendable text: Unicode when possible, else YouTube :shortcode:. */
function partsToFavoriteText(parts) {
  return parts.map((part) => {
    if (part.type !== 'emote') return part.text;
    return emoteDisplayText(part) || String(part.shortcode || '').trim() || '';
  }).join('').replace(/\s+/g, ' ').trim();
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

function isMembershipElement(msgEl) {
  const tag = msgEl?.tagName || '';
  return tag === 'YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER'
    || /MEMBERSHIP-ITEM/i.test(tag);
}

function isPinnedChatElement(msgEl) {
  if (!msgEl) return false;
  const tag = msgEl.tagName || '';
  return tag === 'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER'
    || tag === 'YT-LIVE-CHAT-PAID-STICKER-RENDERER'
    || isMembershipElement(msgEl)
    || /PAID-MESSAGE|PAID-STICKER|TICKER-PAID/i.test(tag)
    || !!msgEl.querySelector?.('#purchase-amount, #purchase-amount-chip');
}

function readMembershipBadge(msgEl) {
  const badge = msgEl?.querySelector?.(
    'yt-live-chat-author-badge-renderer[type="member"], #chat-badges yt-live-chat-author-badge-renderer',
  );
  return (
    badge?.getAttribute?.('shared-tooltip-text')
    || badge?.getAttribute?.('aria-label')
    || badge?.querySelector?.('img')?.getAttribute?.('alt')
    || ''
  ).replace(/\s+/g, ' ').trim();
}

function extractMessageParts(msgEl, { includeAmount = true } = {}) {
  const parts = [];
  const amount = readPurchaseAmount(msgEl);
  if (includeAmount && amount) pushTextPart(parts, `${amount} `);

  const messageEl = msgEl.querySelector('#message');
  const messageParts = messageEl ? collectParts(messageEl) : [];
  const membership = isMembershipElement(msgEl);

  // Membership cards often put the welcome text in #header-subtext while #message is empty.
  if (membership || !messageParts.length) {
    parts.push(...collectParts(msgEl.querySelector('#header-primary-text, #primary-text')));
    parts.push(...collectParts(msgEl.querySelector('#header-subtext')));
  }
  if (messageParts.length) {
    parts.push(...messageParts);
  } else if (!membership) {
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

  const membership = isMembershipElement(msgEl);
  const purchaseAmount = readPurchaseAmount(msgEl);
  const membershipBadge = membership ? readMembershipBadge(msgEl) : '';
  // Reuse the amount badge slot for membership labels (e.g. "New member").
  const amount = purchaseAmount || membershipBadge;
  const parts = extractMessageParts(msgEl, { includeAmount: !!purchaseAmount });
  const bodyParts = extractMessageParts(msgEl, { includeAmount: false });
  const rawMessage = partsToText(parts);
  if (!rawMessage && !parts.some((part) => part.type === 'emote') && !amount && !membership) {
    return null;
  }

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
  const superchat = isPinnedChatElement(msgEl);

  return {
    message,
    parts,
    bodyParts,
    amount,
    username,
    usernameColor,
    profileUrl,
    avatarUrl,
    membership,
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
  const membership = isMembershipElement(msgEl);
  const header = msgEl.querySelector('#header') || msgEl.querySelector('#card');
  const content = msgEl.querySelector('#content');
  const headerStyle = header ? getComputedStyle(header) : null;
  const contentStyle = content ? getComputedStyle(content) : null;
  const fallbackBg = membership ? '#0f9d58' : '#e53935';

  const background = (
    membership
      ? (
        readCssVarColor(msgEl, '--yt-live-chat-sponsor')
        || readCssVarColor(msgEl, '--yt-live-chat-pamphlet-background-color')
        || readCssVarColor(msgEl, '--yt-live-chat-moderator-color')
      )
      : ''
  )
    || readCssVarColor(msgEl, '--yt-live-chat-paid-message-primary-container-color')
    || readCssVarColor(msgEl, '--yt-live-chat-paid-message-header-background-color')
    || usableCssColor(headerStyle?.backgroundColor)
    || fallbackBg;
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
    ensureAuthorProfileLink(el);
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

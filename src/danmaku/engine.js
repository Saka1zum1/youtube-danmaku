function appendDanmakuContent(item, message, parts) {
  if (!Array.isArray(parts) || !parts.length) {
    item.textContent = message || '';
    return;
  }

  for (const part of parts) {
    if (part?.type === 'emote') {
      const src = safeEmoteSrc(part.src);
      const fallback = emoteDisplayText(part);
      const title = fallback
        || (part.shortcode && !isEmoteShortcode(fallback) ? part.shortcode : '')
        || String(part.alt || '').trim();
      if (!src) {
        if (fallback) item.appendChild(document.createTextNode(fallback));
        continue;
      }
      const slot = document.createElement('span');
      slot.className = 'ydm-emote';
      slot.style.display = 'inline-block';
      slot.style.width = '1.15em';
      slot.style.height = '1.15em';
      const img = document.createElement('img');
      // Empty alt so a broken/late-loading image does not flash ":clapping_hands:".
      img.alt = '';
      if (title && !isEmoteShortcode(title)) img.title = title;
      else if (fallback) img.title = fallback;
      img.src = src;
      img.draggable = false;
      img.referrerPolicy = 'no-referrer';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.fontSize = '0';
      img.addEventListener('error', () => {
        img.remove();
        if (fallback) slot.textContent = fallback;
        else if (!slot.childNodes.length) slot.remove();
      }, { once: true });
      slot.appendChild(img);
      item.appendChild(slot);
      continue;
    }
    if (part?.text) {
      // Drop pure shortcode leftovers if any slipped into text parts.
      if (EMOTE_SHORTCODE_ONLY_RE.test(part.text)) continue;
      item.appendChild(document.createTextNode(part.text));
    }
  }

  if (!item.childNodes.length) item.textContent = message || '';
}

function normalizeScAmountKey(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function normalizeScAvatarKey(value) {
  return String(value || '').replace(/=s\d+.*$/i, '').split('?')[0];
}

function readTickerDurationSec(el) {
  if (!el) return 0;
  const readers = [
    () => el.durationSec,
    () => el.fullDurationSec,
    () => el.__data?.durationSec,
    () => el.__data?.fullDurationSec,
    () => el.__data?.data?.durationSec,
    () => el.__data?.data?.fullDurationSec,
    () => el.data?.durationSec,
    () => el.data?.fullDurationSec,
  ];
  for (const read of readers) {
    try {
      const value = Number(read());
      if (Number.isFinite(value) && value > 0) return value;
    } catch (_) {
      /* polymer access may throw */
    }
  }
  return 0;
}

function readTickerAmountText(el) {
  if (!el) return '';
  const readers = [
    () => el.__data?.data?.amount?.simpleText,
    () => el.__data?.amount?.simpleText,
    () => el.data?.amount?.simpleText,
    () => el.querySelector?.('#diagonal-amount, #amount')?.textContent,
  ];
  for (const read of readers) {
    try {
      const value = String(read() || '').replace(/\s+/g, ' ').trim();
      if (value) return value;
    } catch (_) {
      /* ignore */
    }
  }
  return '';
}

function findYoutubePaidTicker(payload) {
  const doc = typeof getChatDocument === 'function' ? getChatDocument() : null;
  if (!doc) return null;
  const amountKey = normalizeScAmountKey(payload?.amount);
  const avatarKey = normalizeScAvatarKey(payload?.avatarUrl);
  const nodes = [
    ...doc.querySelectorAll(
      'yt-live-chat-ticker-paid-message-item-renderer, yt-live-chat-ticker-paid-sticker-item-renderer',
    ),
  ];
  let fallback = null;
  for (const el of nodes) {
    if (el._ydmBoundPin) continue;
    const elAmount = normalizeScAmountKey(readTickerAmountText(el) || el.textContent);
    const elAvatar = normalizeScAvatarKey(
      el.querySelector?.('#author-photo img, yt-img-shadow#author-photo img')?.currentSrc
        || el.querySelector?.('#author-photo img, yt-img-shadow#author-photo img')?.getAttribute?.('src')
        || '',
    );
    const amountMatch = amountKey && elAmount && (elAmount === amountKey || elAmount.includes(amountKey) || amountKey.includes(elAmount));
    const avatarMatch = avatarKey && elAvatar && elAvatar === avatarKey;
    if (amountMatch && avatarMatch) return el;
    if (amountMatch && !fallback) fallback = el;
    if (!amountKey && avatarMatch && !fallback) fallback = el;
  }
  return fallback;
}

class DanmakuEngine {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.laneManager = new LaneManager();
    this.layer = null;
    this.superchatLayer = null;
    this.pinnedItems = new Set();
    this.superchatQueue = [];
    this.playerEl = null;
    this.overlayEl = null;
    this.resizeObserver = null;
    this.controlsObserver = null;
    this.controlsHeight = SCROLL_AREA_BOTTOM_RESERVE;
    this.detailCard = null;
    this.detailBackdrop = null;
    this.detailSourceItem = null;
    this.boundUpdate = () => this.updateLayout();
  }

  insertLayer() {
    const overlay = this.overlayEl || this.playerEl;
    overlay.appendChild(this.layer);
    if (this.superchatLayer) overlay.appendChild(this.superchatLayer);
  }

  async mount() {
    this.playerEl = await waitForElement(SELECTORS.player);
    if (!this.playerEl) {
      console.warn('[YDM] Video player not found');
      return;
    }

    this.overlayEl = this.playerEl.querySelector('.html5-video-container') || this.playerEl;
    if (getComputedStyle(this.overlayEl).position === 'static') {
      this.overlayEl.style.position = 'relative';
    }

    this.layer = document.createElement('div');
    this.layer.className = 'ydm-danmaku-layer';
    this.layer.setAttribute('aria-hidden', 'true');
    this.superchatLayer = document.createElement('div');
    this.superchatLayer.className = 'ydm-superchat-layer';
    this.superchatLayer.setAttribute('aria-hidden', 'true');
    this.insertLayer();

    this.resizeObserver = new ResizeObserver(this.boundUpdate);
    this.resizeObserver.observe(this.playerEl);

    const chrome = this.playerEl.querySelector(SELECTORS.playerChrome);
    if (chrome) {
      this.controlsObserver = new ResizeObserver(this.boundUpdate);
      this.controlsObserver.observe(chrome);
    }

    window.addEventListener('resize', this.boundUpdate);
    document.addEventListener('fullscreenchange', this.boundUpdate);
    document.addEventListener('webkitfullscreenchange', this.boundUpdate);
    this.updateLayout();
  }

  destroy() {
    window.removeEventListener('resize', this.boundUpdate);
    document.removeEventListener('fullscreenchange', this.boundUpdate);
    document.removeEventListener('webkitfullscreenchange', this.boundUpdate);
    this.resizeObserver?.disconnect();
    this.controlsObserver?.disconnect();
    this.closeSuperchatDetail();
    hideDanmakuTooltip();
    this.layer?.remove();
    this.superchatLayer?.remove();
    this.layer = null;
    this.superchatLayer = null;
    this.pinnedItems = new Set();
    this.superchatQueue = [];
    this.playerEl = null;
    this.overlayEl = null;
  }

  getLaneHeight() {
    return this.getSettings().fontSize + 8;
  }

  getItemOpacity() {
    return clamp(this.getSettings().opacity ?? 100, 10, 100) / 100;
  }

  getBottomReserve() {
    const player = this.playerEl;
    const controls = player?.querySelector(SELECTORS.playerChrome);
    const autohide = player?.classList.contains('ytp-autohide');
    if (controls && !autohide) {
      const height = controls.getBoundingClientRect().height;
      if (height > 8) this.controlsHeight = Math.ceil(height) + 4;
    }
    return this.controlsHeight;
  }

  getPinnedRowHeight() {
    if (this.getSettings().superchatCompact) {
      return Math.max(28, Math.round(this.getSettings().fontSize * 0.9) + 10);
    }
    return this.getLaneHeight() + 12;
  }

  getPinnedRowGap() {
    return 6;
  }

  getMaxPinnedSuperchats(playerHeight = this.playerEl?.clientHeight || 480) {
    const row = this.getPinnedRowHeight() + this.getPinnedRowGap();
    const topPad = 16;
    const usable = Math.max(row, playerHeight - this.getBottomReserve() - topPad);
    return clamp(Math.floor(usable / row), 1, SUPERCHAT_MAX_PINNED);
  }

  getPinnedBandHeight(count = this.pinnedItems.size) {
    if (count <= 0) return 0;
    const gap = this.getPinnedRowGap();
    const row = this.getPinnedRowHeight();
    let measured = 0;
    let total = 0;
    for (const el of this.pinnedItems) {
      const height = el?.offsetHeight || 0;
      if (height > 0) {
        total += height;
        measured += 1;
      }
    }
    if (measured > 0) {
      total += Math.max(0, count - measured) * row;
      total += Math.max(0, count - 1) * gap;
      // Extra room so slide-in / shadows are not clipped at the top edge.
      return total + 16;
    }
    return count * row + Math.max(0, count - 1) * gap + 16;
  }

  resolveSuperchatPlacement() {
    const raw = String(this.getSettings().superchatPosition || 'top');
    const map = {
      top: { edge: 'top', align: 'center' },
      'top-left': { edge: 'top', align: 'left' },
      topleft: { edge: 'top', align: 'left' },
      bottom: { edge: 'bottom', align: 'center' },
      'bottom-left': { edge: 'bottom', align: 'left' },
      bottom_left: { edge: 'bottom', align: 'left' },
      'bottom-right': { edge: 'bottom', align: 'right' },
      bottomRight: { edge: 'bottom', align: 'right' },
      bottom_right: { edge: 'bottom', align: 'right' },
    };
    return map[raw] || map.top;
  }

  getPinnedBandRect(playerHeight) {
    if (!this.pinnedItems.size || !this.getSettings().superchatPinned) return null;
    let band = this.getPinnedBandHeight();
    const { edge, align } = this.resolveSuperchatPlacement();
    const maxHeight = Math.max(
      this.getPinnedRowHeight() + 16,
      playerHeight - this.getBottomReserve() - 4,
    );
    // Never grow past the player; max-count already limits how many we mount.
    band = Math.min(band, maxHeight);
    const top = edge === 'bottom'
      ? Math.max(0, playerHeight - this.getBottomReserve() - band)
      : 4;
    return { pos: edge, align, top, height: band };
  }

  clearPinnedSuperchats() {
    this.closeSuperchatDetail();
    this.superchatQueue = [];
    for (const item of this.pinnedItems) {
      item._ydmClearFallback?.();
      item._ydmTickerCleanup?.();
      if (item._ydmTickerEl && item._ydmTickerEl._ydmBoundPin === item) {
        delete item._ydmTickerEl._ydmBoundPin;
      }
      item.remove();
    }
    this.pinnedItems.clear();
  }

  getScrollAreaRect(playerRect) {
    const laneHeight = this.getLaneHeight();
    const h = playerRect.height;
    const usable = Math.max(laneHeight, h - this.getBottomReserve());
    let area;

    switch (this.getSettings().scrollArea) {
      case 'top-half':
        area = { top: 0, height: Math.max(laneHeight, usable * 0.5) };
        break;
      case 'bottom-half': {
        const height = Math.max(laneHeight, usable * 0.5);
        area = { top: Math.max(0, usable - height), height };
        break;
      }
      case 'top-quarter':
        area = { top: 0, height: Math.max(laneHeight, usable * 0.25) };
        break;
      default:
        area = { top: 0, height: usable };
        break;
    }

    // When overlay is on, pinned Super Chats may cover scrolling lines.
    if (this.getSettings().superchatOverlayDanmaku) return area;

    const band = this.getPinnedBandRect(h);
    if (!band) return area;
    const areaBottom = area.top + area.height;
    const bandBottom = band.top + band.height;
    if (bandBottom <= area.top || band.top >= areaBottom) return area;
    if (band.pos === 'top') {
      const nextTop = Math.max(area.top, bandBottom + 4);
      return { top: nextTop, height: Math.max(laneHeight, areaBottom - nextTop) };
    }
    const nextBottom = Math.min(areaBottom, band.top - 4);
    return { top: area.top, height: Math.max(laneHeight, nextBottom - area.top) };
  }

  migrateDanmakuItems(items, oldRect, newWidth, newHeight) {
    const oldWidth = oldRect.width || 1;
    const oldHeight = oldRect.height || 1;

    for (const item of items) {
      if (!item.isConnected) continue;

      const top = parseFloat(item.style.top) || 0;
      item.style.top = `${(top / oldHeight) * newHeight}px`;

      const oldTravel = parseFloat(item.style.getPropertyValue('--ydm-travel')) || oldWidth;
      const oldDuration = parseFloat(item.style.getPropertyValue('--ydm-duration')) || 8000;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(item).transform);
      const progress = oldTravel > 0 ? clamp(-matrix.m41 / oldTravel, 0, 1) : 0;

      const itemWidth = item.offsetWidth;
      const newTravel = newWidth + itemWidth;
      const newDuration = (newTravel / oldTravel) * oldDuration;
      const remaining = Math.max(0, newDuration * (1 - progress));

      item._ydmClearRemoveTimer?.();

      const wasPaused = item.classList.contains('ydm-paused');
      if (wasPaused) item.classList.remove('ydm-paused');

      item.style.setProperty('--ydm-travel', `${newTravel}px`);
      item.style.setProperty('--ydm-start', `${-progress * newTravel}px`);
      item.style.setProperty('--ydm-duration', `${remaining}ms`);
      item.style.animation = 'none';
      void item.offsetWidth;
      item.style.animation = '';

      if (wasPaused) item.classList.add('ydm-paused');
      item._ydmScheduleRemove?.(remaining);
    }
  }

  updateLayout() {
    if (!this.layer || !this.playerEl) return;

    const settings = this.getSettings();
    if (!settings.superchatPinned || !settings.enabled) {
      this.clearPinnedSuperchats();
    }

    const rect = this.playerEl.getBoundingClientRect();
    const area = this.getScrollAreaRect(rect);
    const oldRect = this.layer.getBoundingClientRect();
    const items = [...this.layer.querySelectorAll('.ydm-danmaku-item')];
    const shouldMigrate = items.length > 0;

    if (shouldMigrate) hideDanmakuTooltip();
    if (this.layer.parentElement !== this.overlayEl) this.insertLayer();

    Object.assign(this.layer.style, {
      position: 'absolute',
      top: `${area.top}px`,
      left: '0',
      width: '100%',
      height: `${area.height}px`,
      zIndex: '2',
    });

    const newWidth = this.layer.clientWidth;
    const newHeight = this.layer.clientHeight;
    if (shouldMigrate && (
      Math.abs(oldRect.width - newWidth) > 1
      || Math.abs(oldRect.height - newHeight) > 1
    )) {
      this.migrateDanmakuItems(items, oldRect, newWidth, newHeight);
    }

    const laneHeight = this.getLaneHeight();
    this.laneManager.reset(Math.floor(newHeight / laneHeight), laneHeight);
    this.layer.style.display = this.getSettings().enabled ? 'block' : 'none';
    this.layoutSuperchat(rect);

    const opacity = this.getItemOpacity();
    for (const item of items) {
      if (item.isConnected) item.style.opacity = String(opacity);
    }
  }

  layoutSuperchat(playerRect) {
    if (!this.superchatLayer) return;
    const band = this.getPinnedBandRect(playerRect.height);
    if (!band) {
      this.superchatLayer.style.display = 'none';
      return;
    }
    const alignItems = band.align === 'left'
      ? 'flex-start'
      : band.align === 'right'
        ? 'flex-end'
        : 'center';
    this.superchatLayer.classList.toggle('ydm-sc-bottom', band.pos === 'bottom');
    this.superchatLayer.classList.toggle('ydm-sc-align-left', band.align === 'left');
    this.superchatLayer.classList.toggle('ydm-sc-align-right', band.align === 'right');
    // Sit above scrolling danmaku when overlay is enabled.
    const zIndex = this.getSettings().superchatOverlayDanmaku ? '6' : '4';
    Object.assign(this.superchatLayer.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems,
      // Keep the oldest (top) pins visible; newer pins stack downward / upward.
      justifyContent: band.pos === 'bottom' ? 'flex-end' : 'flex-start',
      gap: `${this.getPinnedRowGap()}px`,
      position: 'absolute',
      top: `${band.top}px`,
      left: '0',
      width: '100%',
      height: `${band.height}px`,
      zIndex,
      // Visible so entrance animation / multi-row stacks are not clipped.
      overflow: 'visible',
      boxSizing: 'border-box',
      padding: band.align === 'center' ? '8px 0 4px' : '8px 10px 4px',
      pointerEvents: 'none',
    });
  }

  render(payload) {
    const settings = this.getSettings();
    if (payload.superchat && settings.superchatPinned) {
      this.queueSuperchat(payload);
      return;
    }
    this.renderScrolling(payload);
  }

  queueSuperchat(payload) {
    if (!this.superchatLayer || !this.getSettings().enabled) return;
    if (this.pinnedItems.size >= this.getMaxPinnedSuperchats()) {
      this.superchatQueue.push(payload);
      const maxQueued = Math.max(6, this.getMaxPinnedSuperchats() * 2);
      if (this.superchatQueue.length > maxQueued) this.superchatQueue.shift();
      return;
    }
    this.mountSuperchat(payload);
  }

  drainSuperchatQueue() {
    if (!this.superchatLayer || !this.getSettings().enabled || !this.getSettings().superchatPinned) {
      this.superchatQueue = [];
      return;
    }
    while (this.superchatQueue.length && this.pinnedItems.size < this.getMaxPinnedSuperchats()) {
      const next = this.superchatQueue.shift();
      if (!next) break;
      this.mountSuperchat(next, { skipLayout: true });
    }
    this.updateLayout();
  }

  mountSuperchat(payload, { skipLayout = false } = {}) {
    const {
      username,
      message,
      parts,
      bodyParts,
      amount,
      usernameColor,
      profileUrl,
      avatarUrl,
      originalMessage,
      translated,
      superchatStyle,
    } = payload || {};
    const settings = this.getSettings();
    const compact = !!settings.superchatCompact;
    const rawParts = Array.isArray(bodyParts) && bodyParts.length
      ? bodyParts
      : (Array.isArray(parts) ? parts : []);
    const displayParts = stripAmountFromParts(rawParts, amount);
    const hasEmote = displayParts.some((part) => part.type === 'emote' && part.src);
    const bodyText = stripAmountFromText(
      displayParts.map((part) => (
        part?.type === 'emote' ? (part.alt ? ` ${part.alt} ` : ' ') : (part?.text || '')
      )).join('').replace(/\s+/g, ' ').trim()
        || String(message || ''),
      amount,
    );
    if (!this.superchatLayer || (!bodyText && !hasEmote && !username && !amount)) return;

    const animation = ['fade', 'slide', 'pop', 'shine'].includes(settings.superchatAnimation)
      ? settings.superchatAnimation
      : 'slide';
    const followYoutube = !!settings.superchatDurationFollowYoutube;
    const manualDuration = clamp(Number(settings.superchatDuration) || 15, 2, 300);
    const ticker = followYoutube ? findYoutubePaidTicker({ amount, avatarUrl }) : null;
    const tickerDuration = ticker ? readTickerDurationSec(ticker) : 0;
    const followTicker = !!(followYoutube && ticker?.isConnected);
    // Prefer ticker durationSec; if following ticker without a readable value, keep
    // the pin opaque until the ticker leaves (long CSS lifetime + removal observer).
    const duration = followTicker && tickerDuration > 0
      ? clamp(tickerDuration, 2, 3600)
      : followTicker
        ? Math.max(manualDuration, 120)
        : manualDuration;
    // Match YouTube SC card scale: slightly smaller than scrolling danmaku.
    const baseSize = clamp(Math.round(settings.fontSize * 0.82), 13, 28);
    const item = document.createElement('div');
    item.className = `ydm-superchat-item ydm-sc-${animation}${compact ? ' ydm-sc-compact' : ''}`;
    item.style.setProperty('--ydm-sc-duration', `${duration}s`);
    item.style.background = safeCssColor(superchatStyle?.background || '#e53935');
    item.style.color = safeCssColor(superchatStyle?.color || '#ffffff');
    item.style.fontSize = `${baseSize}px`;
    item.style.fontFamily = settings.fontFamily;
    item.style.zIndex = String(10 + this.pinnedItems.size);
    item.style.pointerEvents = 'auto';

    const detailPayload = {
      username: username || '',
      message: message || '',
      bodyText,
      displayParts,
      amount: amount || '',
      usernameColor,
      profileUrl: profileUrl || '',
      avatarUrl: avatarUrl || '',
      originalMessage: originalMessage || message || bodyText || '',
      translated: !!translated,
      superchatStyle: superchatStyle || null,
    };
    item._ydmScPayload = detailPayload;

    const avatarSrc = safeEmoteSrc(avatarUrl);
    if (avatarSrc) {
      const avatar = document.createElement('img');
      avatar.className = 'ydm-sc-avatar';
      avatar.src = avatarSrc;
      avatar.alt = '';
      avatar.draggable = false;
      avatar.referrerPolicy = 'no-referrer';
      item.appendChild(avatar);
    }

    if (username) {
      const name = document.createElement('span');
      name.className = compact ? 'ydm-sc-username ydm-sc-username-compact' : 'ydm-sc-username';
      name.textContent = username;
      name.title = username;
      name.style.color = safeCssColor(superchatStyle?.color || '#ffffff');
      item.appendChild(name);
    }

    if (amount) {
      const amt = document.createElement('span');
      amt.className = compact ? 'ydm-sc-amount ydm-sc-amount-badge' : 'ydm-sc-amount';
      amt.textContent = amount;
      amt.style.color = safeCssColor(superchatStyle?.color || '#ffffff');
      item.appendChild(amt);
    }

    let messageClip = null;
    let messageTrack = null;
    if (!compact && (bodyText || hasEmote)) {
      messageClip = document.createElement('span');
      messageClip.className = 'ydm-sc-message-clip';
      messageTrack = document.createElement('span');
      messageTrack.className = 'ydm-sc-message';
      messageTrack.style.color = safeCssColor(superchatStyle?.bodyColor || superchatStyle?.color || '#ffffff');
      appendDanmakuContent(messageTrack, bodyText, displayParts);
      messageClip.appendChild(messageTrack);
      item.appendChild(messageClip);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-sc-close';
    closeBtn.setAttribute('aria-label', t('superchatClose'));
    closeBtn.setAttribute('title', t('superchatClose'));
    appendMarkup(closeBtn, ICON_CLOSE);
    item.appendChild(closeBtn);

    this.superchatLayer.appendChild(item);
    this.pinnedItems.add(item);
    if (!skipLayout) {
      this.updateLayout();
      // Remeasure after paint so multi-row stacks get a tall enough band.
      requestAnimationFrame(() => this.updateLayout());
    }
    if (!compact) this.armSuperchatMarquee(item, messageClip, messageTrack, duration);
    requestSpeech(speechSourceText(bodyText || message, displayParts));

    let fallback = null;
    const armFallback = (ms) => {
      clearTimeout(fallback);
      fallback = setTimeout(() => this.finishSuperchat(item), ms);
    };
    item._ydmArmFallback = armFallback;
    item._ydmClearFallback = () => clearTimeout(fallback);
    item._ydmTickerCleanup = null;

    if (followTicker) {
      ticker._ydmBoundPin = item;
      item._ydmTickerEl = ticker;
      const host = ticker.parentElement || ticker.ownerDocument?.body;
      if (host) {
        const observer = new MutationObserver(() => {
          if (ticker.isConnected) return;
          observer.disconnect();
          clearTimeout(fallback);
          this.finishSuperchat(item);
        });
        observer.observe(host, { childList: true, subtree: true });
        item._ydmTickerCleanup = () => {
          observer.disconnect();
          if (ticker._ydmBoundPin === item) delete ticker._ydmBoundPin;
        };
      }
    }

    // When following YouTube without a readable durationSec, wait on ticker removal
    // and keep a generous fallback so CSS animation does not dismiss early.
    const lifetimeMs = followTicker && !(tickerDuration > 0)
      ? Math.max(manualDuration, 120) * 1000
      : (duration + 2) * 1000;
    armFallback(lifetimeMs);

    item.addEventListener('animationend', (event) => {
      if (event.target !== item) return;
      if (event.animationName === 'ydm-sc-shine-sweep' || event.animationName === 'ydm-sc-marquee') return;
      // Ticker-synced pins dismiss when the ticker leaves (or fallback fires).
      if (followTicker) return;
      clearTimeout(fallback);
      this.finishSuperchat(item);
    });

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(fallback);
      this.finishSuperchat(item);
    });

    if (compact) {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.ydm-sc-close')) return;
        e.preventDefault();
        e.stopPropagation();
        this.openSuperchatDetail(item);
      });
      item.addEventListener('pointerenter', () => clearTimeout(fallback));
      item.addEventListener('pointerleave', () => {
        if (this.detailSourceItem === item) return;
        armFallback(followTicker ? lifetimeMs : 20000);
      });
    } else {
      attachDanmakuInteraction(item, {
        username,
        usernameColor,
        profileUrl,
        originalMessage,
        translated,
        onPause: () => clearTimeout(fallback),
        onResume: () => armFallback(followTicker ? lifetimeMs : 20000),
      });
    }
  }

  closeSuperchatDetail() {
    const source = this.detailSourceItem;
    this.detailBackdrop?.remove();
    this.detailCard?.remove();
    this.detailBackdrop = null;
    this.detailCard = null;
    this.detailSourceItem = null;
    if (source?.isConnected) {
      source.classList.remove('ydm-sc-detail-open', 'ydm-paused');
      source._ydmArmFallback?.(20000);
    }
  }

  openSuperchatDetail(item) {
    if (!item?.isConnected) return;
    const payload = item._ydmScPayload;
    if (!payload) return;

    this.closeSuperchatDetail();
    hideDanmakuTooltip?.();
    item._ydmClearFallback?.();
    item.classList.add('ydm-sc-detail-open', 'ydm-paused');
    this.detailSourceItem = item;

    const host = this.playerEl || this.overlayEl || document.body;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const backdrop = document.createElement('div');
    backdrop.className = 'ydm-sc-detail-backdrop';
    backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeSuperchatDetail();
    });

    const card = document.createElement('div');
    card.className = 'ydm-sc-detail-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    const bg = safeCssColor(payload.superchatStyle?.background || '#e53935');
    const fg = safeCssColor(payload.superchatStyle?.color || '#ffffff');
    const bodyFg = safeCssColor(payload.superchatStyle?.bodyColor || fg);
    card.style.background = bg;
    card.style.color = fg;

    const header = document.createElement('div');
    header.className = 'ydm-sc-detail-header';

    const avatarSrc = safeEmoteSrc(payload.avatarUrl);
    if (avatarSrc) {
      const avatar = document.createElement('img');
      avatar.className = 'ydm-sc-detail-avatar';
      avatar.src = avatarSrc;
      avatar.alt = '';
      avatar.draggable = false;
      avatar.referrerPolicy = 'no-referrer';
      header.appendChild(avatar);
    }

    const meta = document.createElement('div');
    meta.className = 'ydm-sc-detail-meta';
    if (payload.username) {
      const name = document.createElement('div');
      name.className = 'ydm-sc-detail-username';
      name.textContent = payload.username;
      meta.appendChild(name);
    }
    if (payload.amount) {
      const amt = document.createElement('div');
      amt.className = 'ydm-sc-detail-amount';
      amt.textContent = payload.amount;
      meta.appendChild(amt);
    }
    header.appendChild(meta);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-sc-detail-close';
    closeBtn.setAttribute('aria-label', t('superchatDetailClose'));
    closeBtn.setAttribute('title', t('superchatDetailClose'));
    appendMarkup(closeBtn, ICON_CLOSE);
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeSuperchatDetail();
    });
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'ydm-sc-detail-body';
    body.style.color = bodyFg;
    if (payload.bodyText || payload.displayParts?.length) {
      appendDanmakuContent(body, payload.bodyText, payload.displayParts);
    } else {
      body.textContent = payload.originalMessage || '';
    }

    const translation = document.createElement('div');
    translation.className = 'ydm-sc-detail-translation';
    translation.hidden = true;

    const actions = document.createElement('div');
    actions.className = 'ydm-sc-detail-actions';

    const makeAction = (icon, label, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ydm-sc-detail-action';
      appendMarkup(btn, icon);
      const span = document.createElement('span');
      span.textContent = label;
      btn.appendChild(span);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(btn);
      });
      actions.appendChild(btn);
      return btn;
    };

    const settings = this.getSettings();
    makeAction(ICON_TRANSLATE, t('chatActionTranslate'), async (btn) => {
      if (btn.disabled) return;
      btn.disabled = true;
      translation.hidden = false;
      translation.textContent = t('chatActionTranslating');
      translation.classList.remove('is-error');
      try {
        const source = payload.bodyText || payload.originalMessage || '';
        const outcome = await translateMessagesManual(
          source,
          settings.translateTargetLang,
          settings.translateProvider,
          { bypassCache: false },
        );
        const text = String(outcome || '').trim();
        if (!text || text === source) {
          translation.textContent = t('chatActionTranslateFailed');
          translation.classList.add('is-error');
          return;
        }
        translation.textContent = text;
        translation.dataset.translated = text;
      } catch (_) {
        translation.textContent = t('chatActionTranslateFailed');
        translation.classList.add('is-error');
      } finally {
        btn.disabled = false;
      }
    });

    makeAction(ICON_SPEECH_ON, t('chatActionSpeak'), () => {
      const spoken = translation.dataset.translated
        || payload.bodyText
        || payload.originalMessage
        || '';
      speakTextNow(spoken);
    });

    makeAction(ICON_FAVORITE, t('chatActionFavorite'), () => {
      const text = String(payload.bodyText || payload.originalMessage || '').trim();
      if (text) addFavoriteText(text);
    });

    if (payload.profileUrl) {
      makeAction(ICON_PROFILE, t('chatActionOpenProfile'), () => {
        window.open(payload.profileUrl, '_blank', 'noopener,noreferrer');
      });
    }

    card.append(header, body, translation, actions);
    card.addEventListener('click', (e) => e.stopPropagation());
    card.addEventListener('pointerdown', (e) => e.stopPropagation());

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeSuperchatDetail();
      }
    };
    document.addEventListener('keydown', onKey, true);

    const prevRemove = card.remove.bind(card);
    card.remove = () => {
      document.removeEventListener('keydown', onKey, true);
      prevRemove();
    };

    host.append(backdrop, card);
    this.detailBackdrop = backdrop;
    this.detailCard = card;
  }

  armSuperchatMarquee(item, clip, track, pinDuration) {
    if (!item || !clip || !track) return;
    const measure = () => {
      if (!item.isConnected || !clip.isConnected || !track.isConnected) return;
      const overflow = track.scrollWidth - clip.clientWidth;
      if (overflow <= 4) {
        item.classList.remove('ydm-sc-marquee');
        track.style.removeProperty('--ydm-sc-marquee-distance');
        track.style.removeProperty('--ydm-sc-marquee-duration');
        return;
      }
      // Keep avatar/amount fixed; scroll only the message text inside the clip.
      const scrollSeconds = clamp(overflow / 36, 2.5, Math.max(3, pinDuration - 0.8));
      item.classList.add('ydm-sc-marquee');
      track.style.setProperty('--ydm-sc-marquee-distance', `-${Math.ceil(overflow)}px`);
      track.style.setProperty('--ydm-sc-marquee-duration', `${scrollSeconds}s`);
    };
    requestAnimationFrame(() => requestAnimationFrame(measure));
  }

  finishSuperchat(item) {
    if (!item) return;
    if (!this.pinnedItems.has(item) && !item.isConnected) return;
    if (this.detailSourceItem === item) this.closeSuperchatDetail();
    item._ydmClearFallback?.();
    item._ydmTickerCleanup?.();
    item._ydmTickerCleanup = null;
    if (item._ydmTickerEl && item._ydmTickerEl._ydmBoundPin === item) {
      delete item._ydmTickerEl._ydmBoundPin;
    }
    item._ydmTickerEl = null;
    this.pinnedItems.delete(item);
    item.remove();
    if (this.superchatQueue.length && this.getSettings().superchatPinned && this.getSettings().enabled) {
      this.drainSuperchatQueue();
      return;
    }
    this.updateLayout();
  }

  renderScrolling({ username, message, parts, usernameColor, profileUrl, originalMessage, translated }) {
    const settings = this.getSettings();
    const hasEmote = Array.isArray(parts) && parts.some((part) => part.type === 'emote' && part.src);
    if (!settings.enabled || !this.layer || (!message && !hasEmote)) return;

    const layerWidth = this.layer.clientWidth || 800;
    const speed = clamp(settings.speed, 1, 10);
    const baseDuration = 30000;
    const laneHeight = this.getLaneHeight();

    const item = document.createElement('div');
    item.className = 'ydm-danmaku-item';
    appendDanmakuContent(item, message, parts);
    item.style.top = '0';
    item.style.color = safeCssColor(usernameColor);
    item.style.fontSize = `${settings.fontSize}px`;
    item.style.fontFamily = settings.fontFamily;
    item.style.opacity = String(this.getItemOpacity());
    item.style.visibility = 'hidden';
    item.style.animation = 'none';

    this.layer.appendChild(item);
    const itemWidth = item.offsetWidth;
    const travel = layerWidth + itemWidth;
    const durationMs = Math.round((travel / layerWidth) * (baseDuration / speed));
    const lane = this.laneManager.acquire(durationMs);

    item.style.top = `${lane * laneHeight}px`;
    item.style.visibility = '';
    item.style.setProperty('--ydm-travel', `${travel}px`);
    item.style.setProperty('--ydm-start', '0px');
    item.style.setProperty('--ydm-duration', `${durationMs}ms`);
    void item.offsetWidth;
    item.style.animation = '';

    const startAt = Date.now();
    let pausedAt = 0;
    let totalPaused = 0;
    let removeTimer = null;

    const scheduleRemove = (remainingMs = durationMs) => {
      const elapsed = Date.now() - startAt - totalPaused;
      const remaining = remainingMs ?? Math.max(0, durationMs - elapsed);
      clearTimeout(removeTimer);
      removeTimer = setTimeout(() => item.remove(), remaining + 500);
    };

    item._ydmClearRemoveTimer = () => clearTimeout(removeTimer);
    item._ydmScheduleRemove = scheduleRemove;

    const onPause = () => {
      pausedAt = Date.now();
      clearTimeout(removeTimer);
    };

    const onResume = () => {
      if (pausedAt) {
        totalPaused += Date.now() - pausedAt;
        pausedAt = 0;
      }
      scheduleRemove();
    };

    requestSpeech(speechSourceText(message, parts));

    attachDanmakuInteraction(item, {
      username,
      usernameColor,
      profileUrl,
      originalMessage,
      translated,
      onPause,
      onResume,
    });
    scheduleRemove();

    item.addEventListener('animationend', () => {
      clearTimeout(removeTimer);
      item.remove();
    }, { once: true });
  }
}

function appendDanmakuContent(item, message, parts) {
  if (!Array.isArray(parts) || !parts.length) {
    item.textContent = message || '';
    return;
  }

  for (const part of parts) {
    if (part?.type === 'emote') {
      const src = safeEmoteSrc(part.src);
      if (!src) {
        if (part.alt) item.appendChild(document.createTextNode(part.alt));
        continue;
      }
      const slot = document.createElement('span');
      slot.className = 'ydm-emote';
      slot.style.display = 'inline-block';
      slot.style.width = '1.15em';
      slot.style.height = '1.15em';
      const img = document.createElement('img');
      img.alt = part.alt || '';
      img.src = src;
      img.draggable = false;
      img.referrerPolicy = 'no-referrer';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.fontSize = '0';
      slot.appendChild(img);
      item.appendChild(slot);
      continue;
    }
    if (part?.text) item.appendChild(document.createTextNode(part.text));
  }

  if (!item.childNodes.length) item.textContent = message || '';
}

class DanmakuEngine {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.laneManager = new LaneManager();
    this.layer = null;
    this.superchatLayer = null;
    this.pinnedItem = null;
    this.superchatQueue = [];
    this.playerEl = null;
    this.overlayEl = null;
    this.resizeObserver = null;
    this.controlsObserver = null;
    this.controlsHeight = SCROLL_AREA_BOTTOM_RESERVE;
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
    hideDanmakuTooltip();
    this.layer?.remove();
    this.superchatLayer?.remove();
    this.layer = null;
    this.superchatLayer = null;
    this.pinnedItem = null;
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

  getPinnedBandHeight() {
    return this.getLaneHeight() + 18;
  }

  getPinnedBandRect(playerHeight) {
    if (!this.pinnedItem || !this.getSettings().superchatPinned) return null;
    const band = this.getPinnedBandHeight();
    const pos = this.getSettings().superchatPosition === 'bottom' ? 'bottom' : 'top';
    const top = pos === 'bottom'
      ? Math.max(0, playerHeight - this.getBottomReserve() - band)
      : 8;
    return { pos, top, height: band };
  }

  getScrollAreaRect(playerRect) {
    const laneHeight = this.getLaneHeight();
    const h = playerRect.height;
    let area;

    switch (this.getSettings().scrollArea) {
      case 'top-half':
        area = { top: 0, height: Math.max(laneHeight, h * 0.5) };
        break;
      case 'top-quarter':
        area = { top: 0, height: Math.max(laneHeight, h * 0.25) };
        break;
      default:
        area = { top: 0, height: Math.max(laneHeight, h - this.getBottomReserve()) };
        break;
    }

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
      this.superchatQueue = [];
      this.pinnedItem?.remove();
      this.pinnedItem = null;
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
    this.superchatLayer.classList.toggle('ydm-sc-bottom', band.pos === 'bottom');
    Object.assign(this.superchatLayer.style, {
      display: 'flex',
      position: 'absolute',
      top: `${band.top}px`,
      left: '0',
      width: '100%',
      height: `${band.height}px`,
      zIndex: '4',
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
    if (this.pinnedItem) {
      this.superchatQueue.push(payload);
      if (this.superchatQueue.length > 6) this.superchatQueue.shift();
      return;
    }
    this.mountSuperchat(payload);
  }

  mountSuperchat({ username, message, parts, usernameColor, profileUrl, originalMessage, translated, superchatStyle }) {
    const settings = this.getSettings();
    const hasEmote = Array.isArray(parts) && parts.some((part) => part.type === 'emote' && part.src);
    if (!this.superchatLayer || (!message && !hasEmote)) return;

    const animation = ['fade', 'slide', 'pop', 'shine'].includes(settings.superchatAnimation)
      ? settings.superchatAnimation
      : 'slide';
    const duration = clamp(Number(settings.superchatDuration) || 6, 2, 15);
    const item = document.createElement('div');
    item.className = `ydm-superchat-item ydm-sc-${animation}`;
    item.style.setProperty('--ydm-sc-duration', `${duration}s`);
    item.style.background = safeCssColor(superchatStyle?.background || '#e53935');
    item.style.color = safeCssColor(superchatStyle?.color || '#ffffff');
    item.style.fontSize = `${settings.fontSize}px`;
    item.style.fontFamily = settings.fontFamily;
    appendDanmakuContent(item, message, parts);
    this.superchatLayer.appendChild(item);
    this.pinnedItem = item;
    this.updateLayout();
    requestSpeech(speechSourceText(message, parts));

    let fallback = null;
    const armFallback = (ms) => {
      clearTimeout(fallback);
      fallback = setTimeout(() => this.finishSuperchat(item), ms);
    };
    armFallback((duration + 2) * 1000);
    item.addEventListener('animationend', (event) => {
      if (event.target !== item || event.animationName === 'ydm-sc-shine-sweep') return;
      clearTimeout(fallback);
      this.finishSuperchat(item);
    });

    attachDanmakuInteraction(item, {
      username,
      usernameColor,
      profileUrl,
      originalMessage,
      translated,
      onPause: () => clearTimeout(fallback),
      onResume: () => armFallback(20000),
    });
  }

  finishSuperchat(item) {
    if (!item || (!item.isConnected && this.pinnedItem !== item)) return;
    if (this.pinnedItem === item) this.pinnedItem = null;
    item.remove();
    const next = this.superchatQueue.shift();
    if (next && this.getSettings().superchatPinned && this.getSettings().enabled) {
      this.mountSuperchat(next);
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

const PIP_ASPECT_LOCKED_KEY = 'ydmPipAspectLocked';
const PIP_CHAT_MAX_LENGTH = 200;

class EnhancedPip {
  constructor({ getSettings, danmaku, favoritesPanel, onToggleDanmaku, onOpenSettings, onStateChange } = {}) {
    this.getSettings = getSettings;
    this.danmaku = danmaku || null;
    this.favoritesPanel = favoritesPanel || null;
    this.onToggleDanmaku = onToggleDanmaku;
    this.onOpenSettings = onOpenSettings;
    this.onStateChange = onStateChange;
    this.pipWindow = null;
    this.sourceVideo = null;
    this.pipVideo = null;
    this.laneManager = new LaneManager();
    this.opening = false;
    this.reloading = false;
    this.inputOpen = false;
    this.favOpen = false;
    this.sending = false;
    this.nodes = null;
    this.keepAliveVideo = null;
    this.keepAliveHandle = null;
    this.keepAliveTimer = null;
    this.closedTimer = null;
    this.pageToastTimer = null;
    this.toastTimer = null;
    this.statusTimer = null;
    this.sourceReloadTimer = null;
    this.boundPlay = () => this.syncPlayback();
    this.boundPause = () => this.syncPlayback();
    this.boundRate = () => this.syncPlayback();
    this.boundResize = () => this.resetLanes();
    this.boundPageHide = () => this.cleanup();
    this.boundKeyDown = (event) => this.onKeyDown(event);
    this.boundComment = (payload) => this.renderComment(payload);
    this.boundSourceEmptied = () => this.scheduleSourceReload();
    this.aspectLocked = this.loadAspectLocked();
  }

  loadAspectLocked() {
    try {
      return !!GM_getValue(PIP_ASPECT_LOCKED_KEY, false);
    } catch (_) {
      return false;
    }
  }

  saveAspectLocked() {
    try {
      GM_setValue(PIP_ASPECT_LOCKED_KEY, this.aspectLocked);
    } catch (_) {
      /* storage unavailable */
    }
  }

  toggleAspectLock() {
    this.aspectLocked = !this.aspectLocked;
    this.saveAspectLocked();
    this.applyAspectLock();
  }

  applyAspectLock() {
    const wrap = this.nodes?.wrap;
    if (wrap) wrap.classList.toggle('is-aspect-locked', this.aspectLocked);
    const btn = this.nodes?.aspectBtn;
    if (!btn) return;
    this.setIcon(this.pipWindow.document, btn, this.aspectLocked ? ICON_PIP_ASPECT_LOCK : ICON_PIP_ASPECT_UNLOCK);
    const label = t(this.aspectLocked ? 'pipAspectUnlock' : 'pipAspectLock');
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }

  pageWindow() {
    const candidates = [];
    try {
      if (typeof unsafeWindow !== 'undefined' && unsafeWindow) candidates.push(unsafeWindow);
    } catch (_) {
      /* sandbox may refuse unsafeWindow */
    }
    candidates.push(window);
    for (const win of candidates) {
      try {
        if (typeof win.documentPictureInPicture?.requestWindow === 'function') return win;
      } catch (_) { /* ignore */ }
    }
    return candidates[0] || window;
  }

  isSupported() {
    const api = this.pageWindow().documentPictureInPicture;
    return typeof api?.requestWindow === 'function';
  }

  isOpen() {
    return !!(this.pipWindow && !this.pipWindow.closed);
  }

  isMediaStream(value) {
    return !!value && typeof value.getVideoTracks === 'function' && typeof value.getTracks === 'function';
  }

  captureSource(video) {
    const existing = video?.srcObject;
    if (this.isMediaStream(existing)) {
      try {
        const clone = typeof existing.clone === 'function' ? existing.clone() : null;
        if (this.isMediaStream(clone) && clone.getVideoTracks().length) return clone;
      } catch (_) {
        /* fall through to a fresh capture */
      }
    }
    const capture = video?.captureStream || video?.mozCaptureStream;
    if (typeof capture !== 'function') {
      try {
        const proto = this.pageWindow().HTMLVideoElement?.prototype;
        const pageCapture = proto?.captureStream || proto?.mozCaptureStream;
        if (typeof pageCapture === 'function') return pageCapture.call(video);
      } catch (_) {
        return null;
      }
      return null;
    }
    return capture.call(video);
  }

  findSourceVideo() {
    const root = getPlayerElement()
      || document.querySelector('#movie_player, .html5-video-player');
    if (!root) return null;
    const videos = [...root.querySelectorAll('video')];
    const main = videos.find((video) => video.classList.contains('html5-main-video'));
    if (main && main.videoWidth > 0) return main;
    const area = (video) => (video.videoWidth || 0) * (video.videoHeight || 0);
    const pool = videos.filter((video) => video !== main);
    const playing = pool
      .filter((video) => video.videoWidth > 0 && !video.paused && video.readyState >= 2)
      .sort((a, b) => area(b) - area(a));
    if (playing.length) return playing[0];
    const sized = pool
      .filter((video) => video.videoWidth > 0)
      .sort((a, b) => area(b) - area(a));
    if (sized.length) return sized[0];
    return main || videos[0] || null;
  }

  toggle() {
    if (this.opening) return;
    if (this.isOpen()) {
      this.close(true);
      return;
    }
    this.open();
  }

  async open() {
    if (this.opening || this.isOpen()) {
      if (this.isOpen()) {
        try { this.pipWindow.focus(); } catch (_) { /* window may already be closing */ }
      }
      return;
    }
    if (!this.isSupported()) {
      this.showPageToast(t('pipNeedBrowser'));
      return;
    }

    const source = this.findSourceVideo();
    if (!source?.videoWidth || !this.canCapture(source)) {
      this.showPageToast(t('pipNoVideo'));
      return;
    }

    let stream = null;
    try {
      stream = this.captureSource(source);
    } catch (_) {
      this.showPageToast(t('pipCaptureFailed'));
      return;
    }
    if (!stream) {
      this.showPageToast(t('pipCaptureFailed'));
      return;
    }

    this.opening = true;
    let pipWindow = null;
    try {
      pipWindow = await this.pageWindow().documentPictureInPicture.requestWindow({
        width: 670,
        height: 380,
      });
    } catch (_) {
      this.stopStream(stream);
      this.showPageToast(t('pipOpenFailed'));
      return;
    } finally {
      this.opening = false;
    }

    if (!pipWindow) {
      this.stopStream(stream);
      this.showPageToast(t('pipOpenFailed'));
      return;
    }

    this.pipWindow = pipWindow;
    this.sourceVideo = source;
    this.mountDocument(pipWindow);
    const pipVideo = this.nodes.video;
    this.pipVideo = pipVideo;
    pipVideo.srcObject = stream;
    pipVideo.muted = true;
    try { await pipVideo.play(); } catch (_) { /* autoplay can reject until the next frame */ }

    this.dimSource(true);
    this.bindSourceSync(source);
    this.startKeepAlive(source);
    this.attachDanmaku();
    this.bindCleanup(pipWindow);
    this.syncSettings();
    this.syncPlayback();
    this.onStateChange?.();
    try { pipWindow.focus(); } catch (_) { /* focus is best-effort */ }
  }

  canCapture(video) {
    if (!video) return false;
    if (typeof video.captureStream === 'function' || typeof video.mozCaptureStream === 'function') return true;
    if (this.isMediaStream(video.srcObject)) return true;
    try {
      const proto = this.pageWindow().HTMLVideoElement?.prototype;
      return typeof proto?.captureStream === 'function' || typeof proto?.mozCaptureStream === 'function';
    } catch (_) {
      return false;
    }
  }

  close(focusOpener = false) {
    const source = this.sourceVideo;
    this.cleanup();
    if (focusOpener) {
      try { window.focus(); } catch (_) { /* opener may be gone */ }
      try { source?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) { /* not laid out */ }
    }
  }

  destroy() {
    this.close(false);
    this.clearPageToast();
  }

  cleanup() {
    if (!this.pipWindow && !this.sourceVideo && !this.pipVideo) return;
    const win = this.pipWindow;
    const pipVideo = this.pipVideo;
    this.pipWindow = null;
    this.pipVideo = null;

    this.detachDanmaku();
    this.stopKeepAlive();
    this.unbindSourceSync();
    this.dimSource(false);
    clearInterval(this.closedTimer);
    this.closedTimer = null;
    clearTimeout(this.toastTimer);
    this.toastTimer = null;
    clearTimeout(this.statusTimer);
    this.statusTimer = null;
    clearTimeout(this.sourceReloadTimer);
    this.sourceReloadTimer = null;

    if (win) {
      win.removeEventListener('pagehide', this.boundPageHide);
      win.removeEventListener('resize', this.boundResize);
      win.document?.removeEventListener('keydown', this.boundKeyDown, true);
    }
    this.stopStream(pipVideo?.srcObject);
    if (pipVideo) pipVideo.srcObject = null;

    this.nodes = null;
    this.inputOpen = false;
    this.favOpen = false;
    this.sending = false;
    this.reloading = false;
    this.sourceVideo = null;

    if (win && !win.closed) {
      try { win.close(); } catch (_) { /* already closing */ }
    }
    this.onStateChange?.();
  }

  stopStream(stream) {
    try {
      stream?.getTracks?.().forEach((track) => track.stop());
    } catch (_) {
      /* stopping a capture track must not break the source video */
    }
  }

  dimSource(hidden) {
    const video = this.sourceVideo;
    if (!video) return;
    if (hidden) {
      video.style.setProperty('opacity', '0.01', 'important');
      video.style.setProperty('pointer-events', 'none', 'important');
      return;
    }
    video.style.removeProperty('opacity');
    video.style.removeProperty('pointer-events');
  }

  bindSourceSync(source) {
    source.addEventListener('play', this.boundPlay);
    source.addEventListener('pause', this.boundPause);
    source.addEventListener('ratechange', this.boundRate);
    source.addEventListener('emptied', this.boundSourceEmptied);
  }

  unbindSourceSync() {
    const source = this.sourceVideo;
    if (!source) return;
    source.removeEventListener('play', this.boundPlay);
    source.removeEventListener('pause', this.boundPause);
    source.removeEventListener('ratechange', this.boundRate);
    source.removeEventListener('emptied', this.boundSourceEmptied);
  }

  syncPlayback() {
    const source = this.sourceVideo;
    const pipVideo = this.pipVideo;
    if (!source || !pipVideo) return;
    const rate = Number(source.playbackRate);
    if (Number.isFinite(rate) && rate > 0) pipVideo.playbackRate = rate;
    if (source.paused) pipVideo.pause();
    else pipVideo.play().catch(() => {});
  }

  scheduleSourceReload() {
    if (!this.isOpen() || this.reloading) return;
    if (Date.now() - (this.lastSourceReload || 0) < 1500) return;
    clearTimeout(this.sourceReloadTimer);
    this.sourceReloadTimer = setTimeout(() => {
      this.lastSourceReload = Date.now();
      if (this.isOpen()) this.reloadVideo({ quiet: true });
    }, 600);
  }

  startKeepAlive(video) {
    this.stopKeepAlive();
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    this.keepAliveVideo = video;
    const tick = () => {
      if (!this.isOpen() || this.keepAliveVideo !== video) return;
      try {
        if (video.readyState >= 2) context.drawImage(video, 0, 0, 2, 2);
      } catch (_) {
        /* a tainted frame should not stop the keep-alive loop */
      }
      if (typeof video.requestVideoFrameCallback === 'function') {
        this.keepAliveHandle = video.requestVideoFrameCallback(tick);
      } else {
        this.keepAliveTimer = setTimeout(tick, 200);
      }
    };
    tick();
  }

  stopKeepAlive() {
    const video = this.keepAliveVideo;
    if (video && this.keepAliveHandle != null && typeof video.cancelVideoFrameCallback === 'function') {
      try { video.cancelVideoFrameCallback(this.keepAliveHandle); } catch (_) { /* already cancelled */ }
    }
    clearTimeout(this.keepAliveTimer);
    this.keepAliveHandle = null;
    this.keepAliveTimer = null;
    this.keepAliveVideo = null;
  }

  bindCleanup(pipWindow) {
    pipWindow.addEventListener('pagehide', this.boundPageHide);
    clearInterval(this.closedTimer);
    this.closedTimer = setInterval(() => {
      if (this.pipWindow?.closed) this.cleanup();
    }, 1000);
  }

  attachDanmaku() {
    if (!this.danmaku) return;
    this.danmaku.onComment = this.boundComment;
  }

  detachDanmaku() {
    if (this.danmaku?.onComment === this.boundComment) this.danmaku.onComment = null;
  }

  syncSettings() {
    if (!this.isOpen()) return;
    this.applyDanmakuVisibility();
    this.resetLanes();
  }

  applyDanmakuVisibility() {
    const layer = this.nodes?.layer;
    const button = this.nodes?.danmakuBtn;
    if (!layer) return;
    const enabled = !!this.getSettings().enabled;
    layer.style.visibility = enabled ? '' : 'hidden';
    button?.classList.toggle('is-off', !enabled);
    if (button) {
      button.title = enabled ? t('danmakuOn') : t('danmakuOff');
      button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
  }

  resetLanes() {
    if (!this.isOpen()) return;
    const metrics = this.laneMetrics();
    this.laneManager.reset(metrics.count, metrics.laneHeight);
  }

  laneMetrics() {
    const settings = this.getSettings();
    const win = this.pipWindow;
    const main = this.nodes?.main;
    const height = main?.clientHeight || win?.innerHeight || 1;
    const laneHeight = Math.max(14, (Number(settings.fontSize) || 22) + 6);
    const reserveBottom = settings.scrollArea === 'top-half' || settings.scrollArea === 'top-quarter'
      ? 0
      : (this.inputOpen ? (this.nodes?.input?.offsetHeight || 52) + 4 : 0);
    const usable = Math.max(laneHeight, height - reserveBottom);
    let top = 0;
    let areaHeight = usable;
    if (settings.scrollArea === 'top-half') areaHeight = Math.max(laneHeight, usable * 0.5);
    else if (settings.scrollArea === 'bottom-half') {
      areaHeight = Math.max(laneHeight, usable * 0.5);
      top = Math.max(0, usable - areaHeight);
    } else if (settings.scrollArea === 'top-quarter') {
      areaHeight = Math.max(laneHeight, usable * 0.25);
    }
    return {
      top,
      laneHeight,
      count: Math.max(1, Math.floor(areaHeight / laneHeight)),
    };
  }

  renderComment(payload) {
    if (!this.isOpen() || !this.nodes?.layer) return;
    const settings = this.getSettings();
    if (!settings.enabled) return;
    const parts = Array.isArray(payload?.parts) && payload.parts.length
      ? payload.parts
      : (payload?.message ? [{ text: payload.message }] : []);
    if (!parts.length) return;

    const doc = this.pipWindow.document;
    const layer = this.nodes.layer;
    const item = doc.createElement('div');
    item.className = 'ydm-pip-dm';
    this.appendParts(doc, item, parts);
    if (!item.childNodes.length && payload?.message) {
      item.textContent = payload.message;
    }
    if (!item.childNodes.length) {
      item.remove();
      return;
    }
    const opacity = clamp(Number(settings.opacity) || 100, 10, 100) / 100;
    item.style.color = safeCssColor(payload.usernameColor);
    item.style.fontSize = `${settings.fontSize || 22}px`;
    item.style.fontFamily = settings.fontFamily || 'sans-serif';
    item.style.opacity = String(opacity);
    item.style.visibility = 'hidden';
    item.style.animation = 'none';
    layer.appendChild(item);

    const layerWidth = layer.clientWidth || this.pipWindow.innerWidth || 670;
    const itemWidth = item.offsetWidth;
    const speed = clamp(Number(settings.speed) || 5, 1, 10);
    const travel = layerWidth + itemWidth;
    const durationMs = Math.round((travel / Math.max(1, layerWidth)) * (30000 / speed));
    const metrics = this.laneMetrics();
    if (!this.laneManager.lanes.length) this.laneManager.reset(metrics.count, metrics.laneHeight);
    const lane = this.laneManager.acquire(durationMs);

    item.style.top = `${(metrics.top || 0) + lane * metrics.laneHeight}px`;
    item.style.left = `${layerWidth}px`;
    item.style.setProperty('--ydm-travel', `${travel}px`);
    item.style.setProperty('--ydm-duration', `${durationMs}ms`);
    item.style.visibility = '';
    item.addEventListener('animationend', () => item.remove(), { once: true });
    void item.offsetWidth;
    item.style.animation = '';
  }

  appendParts(doc, item, parts) {
    for (const part of parts) {
      if (!part) continue;
      if (part.type === 'emote') {
        const src = safeEmoteSrc(part.src);
        const fallback = emoteDisplayText(part) || String(part.name || '').trim();
        if (src) {
          const img = doc.createElement('img');
          img.className = 'ydm-pip-emote';
          img.src = src;
          img.alt = '';
          img.draggable = false;
          img.referrerPolicy = 'no-referrer';
          img.addEventListener('error', () => {
            if (fallback) img.replaceWith(doc.createTextNode(fallback));
            else img.remove();
          }, { once: true });
          item.appendChild(img);
          continue;
        }
        if (fallback) item.appendChild(doc.createTextNode(fallback));
        continue;
      }
      const text = String(part.text || part.value || '');
      if (!text || EMOTE_SHORTCODE_ONLY_RE.test(text)) continue;
      item.appendChild(doc.createTextNode(text));
    }
  }

  mountDocument(pipWindow) {
    const doc = pipWindow.document;
    doc.documentElement.lang = document.documentElement.lang || 'zh-CN';
    doc.title = t('pipTitle');
    doc.head.replaceChildren();
    doc.body.replaceChildren();

    const style = doc.createElement('style');
    style.textContent = this.windowCss();
    doc.head.appendChild(style);

    const wrap = doc.createElement('div');
    wrap.id = 'ydm-pip-wrap';
    const main = doc.createElement('div');
    main.id = 'ydm-pip-main';

    const back = this.makeButton(doc, 'ydm-pip-back', t('pipBack'), t('pipBack'));
    back.textContent = t('pipBack');

    const buttons = doc.createElement('div');
    buttons.id = 'ydm-pip-btns';
    const reloadBtn = this.makeButton(doc, 'ydm-pip-reload', t('pipReload'), t('pipReload'), ICON_PIP_RELOAD);
    const aspectBtn = this.makeButton(doc, 'ydm-pip-aspect', t('pipAspectLock'), t('pipAspectLock'), ICON_PIP_ASPECT_UNLOCK);
    const danmakuBtn = this.makeButton(doc, 'ydm-pip-danmaku-btn', t('pipDanmaku'), t('pipDanmaku'), ICON_DANMAKU_ON);
    const settingsBtn = this.makeButton(doc, 'ydm-pip-settings', t('pipSettings'), t('pipSettings'), ICON_SETTINGS);
    const sendBtn = this.makeButton(doc, 'ydm-pip-send', t('pipSend'), t('pipSend'), ICON_CHAT_SEND);
    buttons.append(reloadBtn, aspectBtn, danmakuBtn, settingsBtn, sendBtn);

    const video = doc.createElement('video');
    video.id = 'ydm-pip-video';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');

    const layer = doc.createElement('div');
    layer.id = 'ydm-pip-danmaku';

    const toast = doc.createElement('div');
    toast.id = 'ydm-pip-toast';

    const input = doc.createElement('div');
    input.id = 'ydm-pip-input';
    const field = doc.createElement('input');
    field.id = 'ydm-pip-field';
    field.type = 'text';
    field.maxLength = PIP_CHAT_MAX_LENGTH;
    field.autocomplete = 'off';
    field.spellcheck = true;
    field.placeholder = this.sendBlockReason() || t('fsChatPlaceholder');

    const favWrap = doc.createElement('div');
    favWrap.className = 'ydm-pip-fav-wrap';
    const favBtn = this.makeButton(doc, 'ydm-pip-fav', t('fsChatFavorites'), t('fsChatFavorites'), ICON_FAVORITE);
    const favList = doc.createElement('div');
    favList.id = 'ydm-pip-fav-list';
    favList.hidden = true;
    favWrap.append(favBtn, favList);

    const submit = this.makeButton(doc, 'ydm-pip-submit', t('fsChatSend'), t('fsChatSend'));
    submit.textContent = t('fsChatSend');

    const status = doc.createElement('div');
    status.id = 'ydm-pip-status';

    input.append(field, favWrap, submit, status);
    main.append(back, buttons, video, layer, toast);
    wrap.append(main, input);
    doc.body.appendChild(wrap);

    this.nodes = {
      wrap, main, back, reloadBtn, aspectBtn, danmakuBtn, settingsBtn, sendBtn,
      video, layer, toast, input, field, favBtn, favList, submit, status,
    };

    const stop = (event) => event.stopPropagation();
    reloadBtn.addEventListener('click', (event) => {
      stop(event);
      this.reloadVideo();
    });
    aspectBtn.addEventListener('click', (event) => {
      stop(event);
      this.toggleAspectLock();
    });
    danmakuBtn.addEventListener('click', (event) => {
      stop(event);
      this.onToggleDanmaku?.();
    });
    settingsBtn.addEventListener('click', (event) => {
      stop(event);
      this.openSettings();
    });
    sendBtn.addEventListener('click', (event) => {
      stop(event);
      this.setInputOpen(true);
    });
    back.addEventListener('click', (event) => {
      stop(event);
      this.close(true);
    });
    favBtn.addEventListener('click', (event) => {
      event.preventDefault();
      stop(event);
      this.toggleFavorites();
    });
    submit.addEventListener('click', (event) => {
      event.preventDefault();
      stop(event);
      this.submit();
    });
    main.addEventListener('click', (event) => {
      if (event.target.closest('#ydm-pip-btns, #ydm-pip-back')) return;
      this.setInputOpen(false);
    });
    pipWindow.addEventListener('resize', this.boundResize);
    doc.addEventListener('keydown', this.boundKeyDown, true);
    this.applyAspectLock();
    this.resetLanes();
    pipWindow.requestAnimationFrame(() => this.resetLanes());
  }

  makeButton(doc, id, label, title, html) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.id = id;
    const textButton = id === 'ydm-pip-back' || id === 'ydm-pip-submit';
    button.className = textButton ? id : (id === 'ydm-pip-fav' ? id : 'ydm-pip-btn');
    button.setAttribute('aria-label', label);
    button.title = title;
    if (html) this.setIcon(doc, button, html);
    return button;
  }

  setIcon(doc, button, markup) {
    const svg = createSvg(markup);
    button.replaceChildren(doc.adoptNode(svg));
  }

  windowCss() {
    return `
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #000; color-scheme: dark; }
      #ydm-pip-wrap, #ydm-pip-main { position: relative; width: 100%; height: 100%; overflow: hidden; }
      #ydm-pip-video {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: fill; background: #000; z-index: 1;
      }
      #ydm-pip-wrap.is-aspect-locked #ydm-pip-video { object-fit: contain; }
      #ydm-pip-danmaku { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
      .ydm-pip-dm {
        position: absolute; white-space: nowrap; font-weight: 700; line-height: 1.2;
        pointer-events: none; will-change: transform;
        text-shadow: 1px 1px 2px rgba(0,0,0,.9), -1px -1px 2px rgba(0,0,0,.9), 0 0 4px rgba(0,0,0,.8);
        animation: ydm-pip-scroll var(--ydm-duration, 8s) linear forwards;
      }
      .ydm-pip-emote {
        height: 1.15em; width: auto; vertical-align: -0.2em; margin: 0 0.08em; pointer-events: none;
      }
      @keyframes ydm-pip-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(calc(-1 * var(--ydm-travel, 100vw))); }
      }
      #ydm-pip-btns {
        position: absolute; top: 50%; left: -50px; transform: translateY(-50%);
        display: flex; flex-direction: column; gap: 8px; z-index: 5;
        transition: left 0.3s ease;
      }
      #ydm-pip-wrap:hover #ydm-pip-btns { left: 10px; }
      .ydm-pip-btn, #ydm-pip-fav {
        position: relative; width: 36px; height: 36px; padding: 0; box-sizing: border-box;
        border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.58); color: #fff; cursor: pointer;
      }
      .ydm-pip-btn svg, #ydm-pip-fav svg { width: 18px; height: 18px; fill: currentColor; display: block; }
      .ydm-pip-btn:hover, #ydm-pip-fav:hover { background: rgba(0,0,0,.82); }
      #ydm-pip-danmaku-btn.is-off { opacity: 0.45; }
      #ydm-pip-danmaku-btn.is-off::after {
        content: ""; position: absolute; width: 22px; height: 2px; background: #fff; transform: rotate(-40deg);
      }
      #ydm-pip-back {
        position: absolute; top: 10px; right: -180px; z-index: 6;
        padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,.35);
        background: rgba(0,0,0,.65); color: #fff; font: 600 14px/1.25 Roboto, Arial, sans-serif;
        cursor: pointer; white-space: nowrap; transition: right 0.3s ease;
      }
      #ydm-pip-wrap:hover #ydm-pip-back { right: 10px; }
      #ydm-pip-back:hover { background: rgba(0,0,0,.88); }
      #ydm-pip-toast {
        position: absolute; left: 50%; top: 16px; transform: translateX(-50%);
        z-index: 7; padding: 6px 12px; border-radius: 6px; background: rgba(0,0,0,.72);
        color: #fff; font: 13px/1.3 Roboto, Arial, sans-serif; opacity: 0; pointer-events: none;
        transition: opacity .2s; white-space: nowrap; max-width: calc(100% - 24px);
      }
      #ydm-pip-toast.is-show { opacity: 1; }
      #ydm-pip-input {
        display: none; position: absolute; left: 0; right: 0; bottom: 0; z-index: 8;
        box-sizing: border-box; gap: 8px; padding: 8px 10px; align-items: center; flex-wrap: wrap;
        background: rgba(14,14,16,.94); border-top: 1px solid rgba(255,255,255,.12);
        font-family: Roboto, Arial, sans-serif;
      }
      #ydm-pip-input.is-active { display: flex; }
      #ydm-pip-field {
        flex: 1; min-width: 0; height: 34px; box-sizing: border-box; padding: 0 10px;
        border-radius: 6px; border: 1px solid rgba(255,255,255,.16); background: #181818;
        color: #f1f1f1; font-size: 14px; outline: none;
      }
      #ydm-pip-field:focus { border-color: #ff4e45; }
      #ydm-pip-fav { flex-shrink: 0; }
      .ydm-pip-fav-wrap { position: relative; flex-shrink: 0; }
      #ydm-pip-fav-list {
        position: absolute; left: 0; bottom: calc(100% + 6px); width: 220px; max-height: 180px;
        overflow: auto; background: #181818; border: 1px solid rgba(255,255,255,.14); border-radius: 6px;
      }
      .ydm-pip-fav-item, .ydm-pip-fav-empty {
        display: block; width: 100%; box-sizing: border-box; text-align: left; background: transparent;
        color: #f1f1f1; border: 0; padding: 8px 10px; font-size: 13px;
      }
      .ydm-pip-fav-item { cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ydm-pip-fav-item:hover { background: rgba(255,255,255,.08); }
      .ydm-pip-fav-empty { color: #aaa; }
      #ydm-pip-submit {
        flex-shrink: 0; height: 34px; padding: 0 12px; border: 0; border-radius: 6px;
        background: #ff4e45; color: #fff; font-weight: 700; cursor: pointer;
      }
      #ydm-pip-submit:hover:not(:disabled) { background: #e53935; }
      #ydm-pip-submit:disabled { opacity: 0.55; cursor: default; }
      #ydm-pip-status { flex: 1 0 100%; min-height: 0; color: #ff8a80; font-size: 12px; line-height: 1.35; }
      #ydm-pip-status:empty { display: none; }
      #ydm-pip-status.is-ok { color: #7dffb3; }
    `;
  }

  onKeyDown(event) {
    if (!this.isOpen() || event.isComposing) return;
    if (event.key === 'Escape') {
      if (this.favOpen) {
        event.preventDefault();
        this.closeFavorites();
        return;
      }
      if (this.inputOpen) {
        event.preventDefault();
        this.setInputOpen(false);
      }
      return;
    }
    if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const field = this.nodes?.field;
    if (field && this.pipWindow.document.activeElement === field) {
      event.preventDefault();
      this.submit();
      return;
    }
    event.preventDefault();
    this.setInputOpen(true);
  }

  setInputOpen(open) {
    if (!this.nodes?.input) return;
    this.inputOpen = !!open;
    this.nodes.input.classList.toggle('is-active', this.inputOpen);
    if (!this.inputOpen) this.closeFavorites();
    if (this.inputOpen) {
      this.nodes.field.placeholder = this.sendBlockReason() || t('fsChatPlaceholder');
      this.pipWindow.requestAnimationFrame(() => this.nodes?.field?.focus());
    }
    this.resetLanes();
  }

  async reloadVideo({ quiet = false } = {}) {
    const source = this.sourceVideo;
    const pipVideo = this.pipVideo;
    if (this.reloading) return;
    if (!source || !pipVideo || !this.canCapture(source)) {
      if (!quiet) this.showToast(t('pipReloadFailed'));
      return;
    }
    this.reloading = true;
    try {
      if (!quiet && source.paused) {
        try { await source.play(); } catch (_) { /* a paused source can still be recaptured */ }
      }
      let stream = null;
      try {
        stream = this.captureSource(source);
      } catch (_) {
        if (!quiet) this.showToast(t('pipReloadFailed'));
        return;
      }
      if (!stream) {
        if (!quiet) this.showToast(t('pipReloadFailed'));
        return;
      }
      const previous = pipVideo.srcObject;
      pipVideo.srcObject = stream;
      pipVideo.muted = true;
      if (previous && previous !== stream) this.stopStream(previous);
      this.syncPlayback();
      try { this.pipWindow?.focus(); } catch (_) { /* focus is best-effort */ }
      if (!quiet) this.showToast(t('pipReloaded'));
    } finally {
      this.reloading = false;
    }
  }

  openSettings() {
    try { window.focus(); } catch (_) { /* opener focus can fail */ }
    try { this.sourceVideo?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) { /* not laid out */ }
    this.onOpenSettings?.();
    this.showToast(t('pipSettingsHint'));
  }

  showToast(message) {
    const toast = this.nodes?.toast;
    if (!toast) return;
    toast.textContent = message || '';
    toast.classList.add('is-show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2000);
  }

  showPageToast(message) {
    let toast = document.getElementById('ydm-pip-page-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ydm-pip-page-toast';
      toast.className = 'ydm-pip-page-toast';
      const host = getPlayerElement() || document.body || document.documentElement;
      host.appendChild(toast);
    }
    toast.textContent = message || '';
    toast.classList.add('is-show');
    clearTimeout(this.pageToastTimer);
    this.pageToastTimer = setTimeout(() => toast.classList.remove('is-show'), 2800);
  }

  clearPageToast() {
    clearTimeout(this.pageToastTimer);
    document.getElementById('ydm-pip-page-toast')?.remove();
  }

  sendBlockReason() {
    const src = typeof chatIframeSrc === 'function' ? chatIframeSrc() : '';
    if (src.includes('live_chat_replay')) return t('pipReplayNoSend');
    if (typeof isLiveChatMode === 'function' && isLiveChatMode()) return '';
    if (src.includes('live_chat')) return '';
    try {
      const details = pageWin().ytInitialPlayerResponse?.videoDetails;
      if (details?.isLive) return '';
      if (details?.isLiveContent) return t('pipReplayNoSend');
    } catch (_) { /* ignore */ }
    if (typeof isLiveWatchMode === 'function' && isLiveWatchMode()) return '';
    return t('fsChatDisabled');
  }

  listFavoriteItems() {
    if (this.favoritesPanel?.visibleItems) {
      this.favoritesPanel.state = loadFavoritesState();
      return this.favoritesPanel.visibleItems();
    }
    return listFavoritesForChannel(loadFavoritesState(), currentChannelId?.() || '');
  }

  toggleFavorites() {
    if (this.favOpen) this.closeFavorites();
    else this.openFavorites();
  }

  openFavorites() {
    const list = this.nodes?.favList;
    const button = this.nodes?.favBtn;
    if (!list || !button) return;
    this.renderFavorites();
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    this.favOpen = true;
  }

  closeFavorites() {
    const list = this.nodes?.favList;
    const button = this.nodes?.favBtn;
    if (list) {
      list.hidden = true;
      list.replaceChildren();
    }
    button?.setAttribute('aria-expanded', 'false');
    this.favOpen = false;
  }

  renderFavorites() {
    const list = this.nodes?.favList;
    if (!list) return;
    const doc = this.pipWindow.document;
    list.replaceChildren();
    const items = this.listFavoriteItems();
    if (!items.length) {
      const empty = doc.createElement('div');
      empty.className = 'ydm-pip-fav-empty';
      empty.textContent = t('fsChatFavoritesEmpty');
      list.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'ydm-pip-fav-item';
      button.title = item.text;
      button.textContent = item.text;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const field = this.nodes?.field;
        if (field) {
          field.value = String(item.text || '').slice(0, PIP_CHAT_MAX_LENGTH);
          field.focus();
          const len = field.value.length;
          field.setSelectionRange(len, len);
        }
        this.closeFavorites();
      });
      list.appendChild(button);
    });
  }

  setStatus(message, ok = false) {
    const status = this.nodes?.status;
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-ok', !!ok && !!message);
  }

  async submit() {
    const field = this.nodes?.field;
    if (!field || this.sending) return;
    const text = field.value.trim();
    if (!text) {
      this.setStatus('');
      return;
    }
    const blocked = this.sendBlockReason();
    if (blocked) {
      this.setStatus(blocked, false);
      return;
    }

    this.sending = true;
    if (this.nodes.submit) this.nodes.submit.disabled = true;
    this.closeFavorites();
    this.setStatus('');
    try {
      await sendYouTubeLiveChatMessage(text);
      field.value = '';
      this.setStatus(t('fsChatSent'), true);
      clearTimeout(this.statusTimer);
      this.statusTimer = setTimeout(() => {
        if (this.nodes?.status?.textContent === t('fsChatSent')) this.setStatus('');
      }, 1200);
    } catch (error) {
      this.setStatus(chatSendErrorMessage(error), false);
    } finally {
      this.sending = false;
      if (this.nodes?.submit) this.nodes.submit.disabled = false;
      field.focus();
    }
  }
}

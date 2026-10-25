class ChatCollapseButton {
  constructor({ onCollapsedChange } = {}) {
    this.onCollapsedChange = onCollapsedChange || null;
    this.headerWrap = null;
    this.headerBtn = null;
    this.expandBtn = null;
    this.collapsed = false;
    this.retryTimer = null;
  }

  setCollapsedChangeHandler(handler) {
    this.onCollapsedChange = handler || null;
  }

  emitCollapsedChange() {
    try {
      this.onCollapsedChange?.(this.collapsed);
    } catch (_) {
      /* ignore */
    }
  }

  getChatFrame() {
    return document.querySelector(SELECTORS.chatHost)
      || document.querySelector('ytd-live-chat-frame');
  }

  /** Ask YouTube's player / flexy layout to refill the freed sidebar width. */
  notifyLayoutResize() {
    const fire = () => {
      window.dispatchEvent(new Event('resize'));
      const flexy = document.querySelector('ytd-watch-flexy');
      const player = document.querySelector('#movie_player, .html5-video-player');
      try {
        if (typeof flexy?.onWindowResized_ === 'function') flexy.onWindowResized_();
        else if (typeof flexy?.onResize_ === 'function') flexy.onResize_();
        else if (typeof flexy?.scheduleVideoContainerResize_ === 'function') {
          flexy.scheduleVideoContainerResize_();
        }
      } catch (_) {
        /* ignore */
      }
      try {
        if (typeof player?.setSize === 'function') player.setSize();
        player?.dispatchEvent?.(new Event('resize'));
      } catch (_) {
        /* ignore */
      }
    };
    requestAnimationFrame(() => {
      fire();
      setTimeout(fire, 50);
      setTimeout(fire, 200);
    });
  }

  collapse() {
    if (this.collapsed) {
      this.ensureExpandButton();
      this.emitCollapsedChange();
      return;
    }
    this.collapsed = true;
    document.documentElement.classList.add('ydm-chat-collapsed');
    this.getChatFrame()?.setAttribute('data-ydm-collapsed', 'true');
    this.ensureExpandButton();
    this.emitCollapsedChange();
    this.notifyLayoutResize();
  }

  expand() {
    if (!this.collapsed && !document.documentElement.classList.contains('ydm-chat-collapsed')) {
      this.emitCollapsedChange();
      return;
    }
    this.collapsed = false;
    document.documentElement.classList.remove('ydm-chat-collapsed');
    this.getChatFrame()?.removeAttribute('data-ydm-collapsed');
    this.expandBtn?.remove();
    this.expandBtn = null;
    this.emitCollapsedChange();
    this.notifyLayoutResize();
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.mountHeaderButton(), 400);
  }

  toggle() {
    if (this.collapsed) this.expand();
    else this.collapse();
  }

  ensureExpandButton() {
    if (this.expandBtn?.isConnected) {
      this.refreshExpandLabel();
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ydm-chat-expand-btn';
    btn.setAttribute('data-ydm-chat-expand', 'true');
    btn.setAttribute('aria-label', t('chatExpand'));
    btn.setAttribute('title', t('chatExpand'));
    appendMarkup(btn, ICON_CHAT_EXPAND);
    const label = document.createElement('span');
    label.className = 'ydm-chat-expand-label';
    label.textContent = t('chatExpand');
    btn.appendChild(label);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.expand();
    });

    const host = document.querySelector('ytd-watch-flexy') || document.body;
    host.appendChild(btn);
    this.expandBtn = btn;
  }

  refreshExpandLabel() {
    if (!this.expandBtn) return;
    this.expandBtn.setAttribute('title', t('chatExpand'));
    this.expandBtn.setAttribute('aria-label', t('chatExpand'));
    const label = this.expandBtn.querySelector('.ydm-chat-expand-label');
    if (label) label.textContent = t('chatExpand');
  }

  createHeaderButton(doc) {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'ydm-chat-collapse-btn';
    btn.setAttribute('data-ydm-chat-collapse', 'true');
    btn.setAttribute('aria-label', t('chatCollapse'));
    btn.setAttribute('title', t('chatCollapse'));
    appendMarkup(btn, ICON_CHAT_COLLAPSE);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.collapse();
    });
    return btn;
  }

  async mountHeaderButton() {
    if (this.collapsed) return;
    if (this.headerWrap?.isConnected || this.headerBtn?.isConnected) {
      this.refreshHeaderLabel();
      return;
    }

    const doc = getChatDocument() || document;
    ensureChatDocStyles(doc);
    if (doc.querySelector('[data-ydm-chat-collapse="true"]')) return;

    const header = await waitForElement(
      '#chat-messages > yt-live-chat-header-renderer, yt-live-chat-header-renderer',
      doc,
      12000,
    );
    if (!header || this.collapsed) return;

    const wrap = doc.createElement('div');
    wrap.className = 'ydm-chat-collapse-wrap';
    wrap.setAttribute('data-ydm-chat-collapse-wrap', 'true');
    this.headerBtn = this.createHeaderButton(doc);
    wrap.appendChild(this.headerBtn);
    this.headerWrap = wrap;

    // Place beside clear (before it), otherwise before YouTube's close.
    const clearWrap = header.querySelector('[data-ydm-chat-clear-wrap="true"]');
    const closeBtn = header.querySelector('#close-button');
    if (clearWrap) clearWrap.before(wrap);
    else if (closeBtn) closeBtn.before(wrap);
    else header.appendChild(wrap);
  }

  refreshHeaderLabel() {
    if (!this.headerBtn) return;
    this.headerBtn.setAttribute('title', t('chatCollapse'));
    this.headerBtn.setAttribute('aria-label', t('chatCollapse'));
  }

  async mount() {
    if (this.collapsed) {
      document.documentElement.classList.add('ydm-chat-collapsed');
      this.ensureExpandButton();
      return;
    }
    await this.mountHeaderButton();
  }

  remount() {
    if (this.collapsed) {
      document.documentElement.classList.add('ydm-chat-collapsed');
      this.ensureExpandButton();
      return;
    }
    if (this.headerWrap?.isConnected || this.headerBtn?.isConnected) {
      this.refreshHeaderLabel();
      return;
    }
    this.headerWrap?.remove();
    this.headerBtn?.remove();
    this.headerWrap = null;
    this.headerBtn = null;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.mountHeaderButton(), 500);
  }

  destroy() {
    clearTimeout(this.retryTimer);
    this.collapsed = false;
    document.documentElement.classList.remove('ydm-chat-collapsed');
    this.getChatFrame()?.removeAttribute('data-ydm-collapsed');
    this.headerWrap?.remove();
    this.headerBtn?.remove();
    this.expandBtn?.remove();
    this.headerWrap = null;
    this.headerBtn = null;
    this.expandBtn = null;
    this.emitCollapsedChange();
  }
}

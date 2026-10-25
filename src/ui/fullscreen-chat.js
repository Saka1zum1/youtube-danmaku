class FullscreenChatInput {
  constructor({ favoritesPanel } = {}) {
    this.favoritesPanel = favoritesPanel || null;
    this.root = null;
    this.input = null;
    this.sendBtn = null;
    this.closeBtn = null;
    this.favBtn = null;
    this.favList = null;
    this.statusEl = null;
    this.sending = false;
    this.favOpen = false;
    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundKeyUp = (e) => this.onKeyUp(e);
    this.boundFsChange = () => this.onFullscreenChange();
    this.boundPointerDown = (e) => this.onPointerDownOutside(e);
    this.playerObserver = null;
  }

  attach() {
    // Prefer window capture so we run before YouTube player handlers that call
    // stopImmediatePropagation on document/player keydown.
    window.addEventListener('keydown', this.boundKeyDown, true);
    window.addEventListener('keyup', this.boundKeyUp, true);
    document.addEventListener('pointerdown', this.boundPointerDown, true);
    document.addEventListener('fullscreenchange', this.boundFsChange);
    document.addEventListener('webkitfullscreenchange', this.boundFsChange);
    this.watchPlayerFullscreenClass();
  }

  watchPlayerFullscreenClass() {
    this.playerObserver?.disconnect();
    const player = getPlayerElement();
    if (!player) {
      clearTimeout(this.playerWatchTimer);
      this.playerWatchTimer = setTimeout(() => this.watchPlayerFullscreenClass(), 1500);
      return;
    }
    this.playerObserver = new MutationObserver(() => this.onFullscreenChange());
    this.playerObserver.observe(player, { attributes: true, attributeFilter: ['class'] });
  }

  destroy() {
    this.close();
    window.removeEventListener('keydown', this.boundKeyDown, true);
    window.removeEventListener('keyup', this.boundKeyUp, true);
    document.removeEventListener('pointerdown', this.boundPointerDown, true);
    document.removeEventListener('fullscreenchange', this.boundFsChange);
    document.removeEventListener('webkitfullscreenchange', this.boundFsChange);
    this.playerObserver?.disconnect();
    this.playerObserver = null;
    clearTimeout(this.playerWatchTimer);
  }

  isEditableTarget(target) {
    if (!target || target === document.body || target === document.documentElement) return false;
    const el = target.nodeType === 1 ? target : target.parentElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return !!el.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]');
  }

  canOpen() {
    // Match twitch-danmaku: only while actually fullscreen (native or ytp-fullscreen).
    if (!getFullscreenMount()) return false;
    if (!isLiveWatchMode()) return false;
    return !!currentChannelId() || document.documentElement.dataset.ydmPreview === 'true';
  }

  stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  isEnterKey(e) {
    return e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13;
  }

  onKeyDown(e) {
    if (e.isComposing) return;
    if (e.key === 'Escape' && this.root) {
      if (this.favOpen) {
        this.stopEvent(e);
        this.closeFavorites();
        return;
      }
    }
    if (!this.isEnterKey(e)) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    this._enterHandledAt = 0;

    if (this.root) {
      if (e.target === this.input || this.root.contains(e.target)) {
        this.stopEvent(e);
        this._enterHandledAt = Date.now();
        this.submit();
      }
      return;
    }

    if (!this.canOpen()) return;
    if (this.isEditableTarget(e.target)) return;

    this.stopEvent(e);
    this._enterHandledAt = Date.now();
    this.open();
  }

  onKeyUp(e) {
    if (e.isComposing) return;
    if (!this.isEnterKey(e)) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (this._enterHandledAt && Date.now() - this._enterHandledAt < 800) return;
    if (this.root) return;
    if (!this.canOpen()) return;
    if (this.isEditableTarget(e.target)) return;
    this.stopEvent(e);
    this.open();
  }

  onPointerDownOutside(e) {
    if (!this.root) return;
    if (Date.now() < (this._ignoreOutsideUntil || 0)) return;
    if (this.root.contains(e.target)) return;
    if (this.input?.value.trim()) return;
    this.close();
  }

  onFullscreenChange() {
    if (!getFullscreenMount()) this.close();
  }

  setStatus(message, ok = false) {
    if (!this.statusEl) return;
    this.statusEl.textContent = message || '';
    this.statusEl.classList.toggle('is-ok', !!ok && !!message);
  }

  listFavoriteItems() {
    if (this.favoritesPanel?.visibleItems) {
      this.favoritesPanel.state = loadFavoritesState();
      return this.favoritesPanel.visibleItems();
    }
    const state = loadFavoritesState();
    return listFavoritesForChannel(state, currentChannelId?.() || '');
  }

  open() {
    if (this.root) {
      this.input?.focus();
      return;
    }

    // Same strategy as twitch-danmaku: mount on the fullscreen host itself
    // (native FS element / #movie_player), not the video container.
    const mount = getFullscreenMount();
    if (!mount) return;

    if (getComputedStyle(mount).position === 'static') {
      mount.style.position = 'relative';
    }

    const root = document.createElement('div');
    root.className = 'ydm-fs-chat';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', t('fsChatPlaceholder'));
    // Inline fallback (Twitch uses CSS z-index 100020 on the FS host).
    Object.assign(root.style, {
      position: 'absolute',
      left: '50%',
      bottom: 'max(72px, 10%)',
      transform: 'translateX(-50%)',
      zIndex: '100020',
      width: 'min(560px, calc(100% - 48px))',
      maxWidth: 'calc(100% - 24px)',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      visibility: 'visible',
      opacity: '1',
    });

    const row = document.createElement('div');
    row.className = 'ydm-fs-chat-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-fs-chat-input';
    input.maxLength = 500;
    input.autocomplete = 'off';
    input.spellcheck = true;
    input.placeholder = t('fsChatPlaceholder');

    const favWrap = document.createElement('div');
    favWrap.className = 'ydm-fs-chat-fav-wrap';

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'ydm-fs-chat-fav';
    favBtn.setAttribute('aria-label', t('fsChatFavorites'));
    favBtn.setAttribute('aria-expanded', 'false');
    appendMarkup(favBtn, ICON_FAVORITE);
    const favLabel = document.createElement('span');
    favLabel.textContent = t('fsChatFavorites');
    favBtn.appendChild(favLabel);

    const favList = document.createElement('div');
    favList.className = 'ydm-fs-chat-fav-list';
    favList.hidden = true;
    favList.setAttribute('role', 'listbox');
    favList.setAttribute('aria-label', t('fsChatFavorites'));

    favWrap.append(favBtn, favList);

    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'ydm-fs-chat-send';
    sendBtn.setAttribute('aria-label', t('fsChatSend'));
    appendMarkup(sendBtn, ICON_CHAT_SEND);
    const sendLabel = document.createElement('span');
    sendLabel.textContent = t('fsChatSend');
    sendBtn.appendChild(sendLabel);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-fs-chat-close';
    closeBtn.setAttribute('aria-label', t('fsChatClose'));
    closeBtn.textContent = t('fsChatClose');

    const meta = document.createElement('div');
    meta.className = 'ydm-fs-chat-meta';

    const status = document.createElement('div');
    status.className = 'ydm-fs-chat-status';

    row.append(input, favWrap, sendBtn, closeBtn);
    meta.append(status);
    root.append(row, meta);

    const trap = (e) => {
      e.stopPropagation();
    };
    root.addEventListener('keydown', trap);
    root.addEventListener('keyup', trap);
    root.addEventListener('keypress', trap);
    root.addEventListener('mousedown', trap);
    root.addEventListener('pointerdown', trap);
    root.addEventListener('click', trap);

    favBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleFavorites();
    });

    sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.submit();
    });

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });

    mount.appendChild(root);
    this.root = root;
    this.input = input;
    this.sendBtn = sendBtn;
    this.closeBtn = closeBtn;
    this.favBtn = favBtn;
    this.favList = favList;
    this.statusEl = status;
    this._ignoreOutsideUntil = Date.now() + 500;
    this.renderFavorites();
    requestAnimationFrame(() => {
      this.input?.focus();
      // Keep composer as the topmost child of the player shell.
      if (this.root?.parentElement === mount) mount.appendChild(this.root);
    });
  }

  toggleFavorites() {
    this.favOpen = !this.favOpen;
    if (this.favList) this.favList.hidden = !this.favOpen;
    this.favBtn?.setAttribute('aria-expanded', this.favOpen ? 'true' : 'false');
    this.favBtn?.classList.toggle('is-open', this.favOpen);
    if (this.favOpen) this.renderFavorites();
  }

  closeFavorites() {
    this.favOpen = false;
    if (this.favList) this.favList.hidden = true;
    this.favBtn?.setAttribute('aria-expanded', 'false');
    this.favBtn?.classList.remove('is-open');
  }

  renderFavorites() {
    if (!this.favList) return;
    this.favList.replaceChildren();
    const items = this.listFavoriteItems();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'ydm-fs-chat-fav-empty';
      empty.textContent = t('fsChatFavoritesEmpty');
      this.favList.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ydm-fs-chat-fav-item';
      btn.setAttribute('role', 'option');
      btn.title = item.text;
      btn.textContent = item.text;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.input) {
          this.input.value = item.text;
          this.input.focus();
          const len = this.input.value.length;
          this.input.setSelectionRange(len, len);
        }
        this.closeFavorites();
      });
      this.favList.appendChild(btn);
    });
  }

  close() {
    this.closeFavorites();
    this.root?.remove();
    this.root = null;
    this.input = null;
    this.sendBtn = null;
    this.closeBtn = null;
    this.favBtn = null;
    this.favList = null;
    this.statusEl = null;
    this.sending = false;
    this.favOpen = false;
  }

  async submit() {
    if (!this.input || this.sending) return;
    const text = this.input.value.trim();
    if (!text) {
      this.setStatus('');
      return;
    }

    this.sending = true;
    if (this.sendBtn) this.sendBtn.disabled = true;
    this.closeFavorites();
    this.setStatus('');

    try {
      await sendYouTubeLiveChatMessage(text);
      this.input.value = '';
      this.setStatus(t('fsChatSent'), true);
      setTimeout(() => {
        if (this.statusEl?.textContent === t('fsChatSent')) this.setStatus('');
      }, 1200);
    } catch (error) {
      this.setStatus(chatSendErrorMessage(error));
    } finally {
      this.sending = false;
      if (this.sendBtn) this.sendBtn.disabled = false;
      this.input?.focus();
    }
  }
}

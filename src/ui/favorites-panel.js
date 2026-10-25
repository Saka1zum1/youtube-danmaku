class FavoritesPanel {
  constructor() {
    this.state = loadFavoritesState();
    this.balloon = null;
    this.anchor = null;
    this.btn = null;
    this.wrap = null;
    this.isOpen = false;
    this.sending = false;
    this.wheel = {
      running: false,
      timer: null,
      statusTimer: null,
      sent: 0,
      startedAt: 0,
      endsAt: 0,
      lastId: '',
      failStreak: 0,
    };
    this.retryTimer = null;
    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundReposition = () => this.reposition();
    this.boundOutsideClick = (e) => this.handleOutsideClick(e);
    this.listEl = null;
    this.statusEl = null;
    this.wheelStatusEl = null;
    this.wheelToggleBtn = null;
  }

  attach() {
    document.addEventListener('keydown', this.boundKeyDown, true);
    this.bindChatKeyDown();
  }

  bindChatKeyDown() {
    const doc = getChatDocument();
    if (!doc || doc === document) return;
    if (this.chatKeyDoc && this.chatKeyDoc !== doc) {
      this.chatKeyDoc.removeEventListener('keydown', this.boundKeyDown, true);
    }
    this.chatKeyDoc = doc;
    doc.addEventListener('keydown', this.boundKeyDown, true);
  }

  destroy() {
    this.stopWheel(false);
    this.close();
    document.removeEventListener('keydown', this.boundKeyDown, true);
    this.chatKeyDoc?.removeEventListener('keydown', this.boundKeyDown, true);
    this.chatKeyDoc = null;
    clearTimeout(this.retryTimer);
    this.wrap?.remove();
    if (this.btn && this.btn !== this.wrap) this.btn.remove();
    this.wrap = null;
    this.btn = null;
    this.anchor = null;
  }

  remount() {
    if (this.wrap?.isConnected || this.btn?.isConnected) return;
    this.wrap?.remove();
    if (this.btn && this.btn !== this.wrap) this.btn.remove();
    this.wrap = null;
    this.btn = null;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.mount(), 500);
  }

  currentChannel() {
    return sanitizeChannelKey(currentChannelId?.() || '');
  }

  visibleItems() {
    return listFavoritesForChannel(this.state, this.currentChannel());
  }

  createButton(doc = document) {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'ydm-fav-btn';
    btn.setAttribute('data-ydm-favorites', 'true');
    btn.setAttribute('aria-label', t('favoritesTitle'));
    btn.setAttribute('title', t('favoritesTitle'));
    appendMarkup(btn, ICON_FAVORITE);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle(btn);
    });
    return btn;
  }

  async mount() {
    if (this.wrap?.isConnected || this.btn?.isConnected) return;

    const doc = getChatDocument() || document;
    ensureChatTranslateStyles(doc);
    const host = await waitForElement('#picker-buttons', doc, 12000);
    if (!host) {
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.mount(), 1200);
      return;
    }

    if (doc.querySelector('[data-ydm-favorites="true"], [data-ydm-favorites-wrap="true"]')) return;

    this.btn = this.createButton(doc);
    this.wrap = this.btn;
    host.appendChild(this.btn);
    this.bindChatKeyDown();
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

  onKeyDown(e) {
    if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!/^[0-9]$/.test(e.key)) return;
    if (this.isEditableTarget(e.target)) return;
    if (this.isOpen && this.balloon?.contains(e.target)) return;

    const channel = this.currentChannel();
    const visible = listFavoritesForChannel(this.state, channel);
    // Prefer channel-scoped shortcut over a colliding global one.
    const item = visible.find((entry) => entry.shortcut === e.key && entry.channel === channel)
      || visible.find((entry) => entry.shortcut === e.key && !entry.channel);
    if (!item) return;
    e.preventDefault();
    e.stopPropagation();
    this.sendFavorite(item);
  }

  toggle(anchor) {
    if (this.isOpen && this.anchor === anchor) this.close();
    else this.open(anchor || this.btn);
  }

  open(anchor) {
    this.close();
    this.state = loadFavoritesState();
    this.anchor = anchor || this.btn;
    this.isOpen = true;
    this.render();
    this.reposition();
    requestAnimationFrame(() => this.reposition());
    window.addEventListener('resize', this.boundReposition);
    document.addEventListener('fullscreenchange', this.boundReposition);
    document.addEventListener('webkitfullscreenchange', this.boundReposition);
    document.addEventListener('scroll', this.boundReposition, true);
    setTimeout(() => document.addEventListener('click', this.boundOutsideClick, true), 0);
  }

  close() {
    const wasOpen = this.isOpen;
    this.isOpen = false;
    this.anchor = null;
    this.balloon?.remove();
    this.balloon = null;
    this.listEl = null;
    this.statusEl = null;
    this.wheelStatusEl = null;
    this.wheelToggleBtn = null;
    window.removeEventListener('resize', this.boundReposition);
    document.removeEventListener('fullscreenchange', this.boundReposition);
    document.removeEventListener('webkitfullscreenchange', this.boundReposition);
    document.removeEventListener('scroll', this.boundReposition, true);
    document.removeEventListener('click', this.boundOutsideClick, true);
    if (wasOpen) this.refreshWheelControls();
  }

  handleOutsideClick(event) {
    if (!this.balloon || !this.isOpen) return;
    if (this.balloon.contains(event.target)) return;
    if (this.anchor?.contains?.(event.target)) return;
    this.close();
  }

  anchorRectInPage() {
    const rect = this.anchor.getBoundingClientRect();
    const ownerWin = this.anchor.ownerDocument?.defaultView;
    if (!ownerWin || ownerWin === window) return rect;
    const frameEl = ownerWin.frameElement;
    if (!frameEl) return rect;
    const fr = frameEl.getBoundingClientRect();
    return {
      left: rect.left + fr.left,
      right: rect.right + fr.left,
      top: rect.top + fr.top,
      bottom: rect.bottom + fr.top,
      width: rect.width,
      height: rect.height,
    };
  }

  reposition() {
    if (!this.balloon || !this.anchor) return;
    const mountTarget = getFullscreenElement() || document.body;
    if (this.balloon.parentElement !== mountTarget) mountTarget.appendChild(this.balloon);

    const rect = this.anchorRectInPage();
    const width = 380;
    const gap = 8;
    const height = this.balloon.offsetHeight || 320;
    let left = rect.right - width;
    let top = rect.top - height - gap;
    left = clamp(left, 8, window.innerWidth - width - 8);
    if (top < 8) top = Math.min(window.innerHeight - height - 8, rect.bottom + gap);
    Object.assign(this.balloon.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${Math.max(8, top)}px`,
      width: `${width}px`,
      zIndex: '100040',
    });
  }

  setStatus(message, ok = false) {
    if (!this.statusEl) return;
    this.statusEl.textContent = message || '';
    this.statusEl.classList.toggle('is-ok', !!ok && !!message);
  }

  persist() {
    this.state = saveFavoritesState(this.state);
    return this.state;
  }

  addFromText(text) {
    const result = addFavoriteText(text);
    this.state = result.state;
    if (result.full) {
      this.setStatus(t('favoritesFull'));
      return false;
    }
    if (!result.item) {
      this.setStatus(t('favoritesEmptyText'));
      return false;
    }
    if (this.isOpen) this.renderList();
    this.setStatus(result.added ? t('favoritesAdded') : t('favoritesExists'), true);
    return true;
  }

  render() {
    const balloon = document.createElement('div');
    balloon.className = 'ydm-balloon ydm-fav-panel';
    balloon.addEventListener('click', (e) => e.stopPropagation());

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';
    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('favoritesTitle');
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-balloon-close';
    closeBtn.setAttribute('aria-label', t('panelClose'));
    closeBtn.textContent = t('panelClose');
    closeBtn.addEventListener('click', () => this.close());
    header.append(title, closeBtn);

    const addRow = document.createElement('div');
    addRow.className = 'ydm-fav-add-row';
    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'ydm-fav-add-input';
    addInput.maxLength = FAVORITE_TEXT_LIMIT;
    addInput.placeholder = t('favoritesAddPlaceholder');
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ydm-fav-add-btn';
    addBtn.textContent = t('favoritesAdd');
    const doAdd = () => {
      const text = addInput.value.trim();
      if (!text) return;
      if (this.addFromText(text)) addInput.value = '';
    };
    addBtn.addEventListener('click', doAdd);
    addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doAdd();
      }
    });
    addRow.append(addInput, addBtn);

    this.listEl = document.createElement('div');
    this.listEl.className = 'ydm-fav-list';

    const status = document.createElement('div');
    status.className = 'ydm-fav-status';
    this.statusEl = status;

    const wheelBox = this.renderWheelSection();

    balloon.append(header, addRow, this.listEl, status, wheelBox);
    (getFullscreenElement() || document.body).appendChild(balloon);
    this.balloon = balloon;
    this.renderList();
    this.refreshWheelControls();
  }

  renderWheelSection() {
    const box = document.createElement('div');
    box.className = 'ydm-fav-wheel';

    const head = document.createElement('div');
    head.className = 'ydm-fav-wheel-head';
    const label = document.createElement('div');
    label.className = 'ydm-fav-wheel-title';
    label.textContent = t('favoritesWheel');
    this.wheelToggleBtn = document.createElement('button');
    this.wheelToggleBtn.type = 'button';
    this.wheelToggleBtn.className = 'ydm-fav-wheel-toggle';
    this.wheelToggleBtn.addEventListener('click', () => {
      if (this.wheel.running) this.stopWheel(true);
      else this.startWheel();
    });
    head.append(label, this.wheelToggleBtn);

    const grid = document.createElement('div');
    grid.className = 'ydm-fav-wheel-grid';

    const fields = [
      ['minIntervalSec', t('favoritesWheelMinInterval'), 1.5, 600],
      ['maxIntervalSec', t('favoritesWheelMaxInterval'), 1.5, 600],
      ['maxCount', t('favoritesWheelMaxCount'), 1, 500],
      ['maxDurationSec', t('favoritesWheelMaxDuration'), 10, 7200],
    ];

    fields.forEach(([key, name, min, max]) => {
      const field = document.createElement('label');
      field.className = 'ydm-fav-wheel-field';
      const span = document.createElement('span');
      span.textContent = name;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(min);
      input.max = String(max);
      input.step = key.includes('Interval') ? '0.5' : '1';
      input.value = String(this.state.wheel[key]);
      input.addEventListener('change', () => {
        const value = clamp(Number(input.value) || min, min, max);
        this.state.wheel[key] = value;
        if (this.state.wheel.minIntervalSec > this.state.wheel.maxIntervalSec) {
          if (key === 'minIntervalSec') this.state.wheel.maxIntervalSec = value;
          else this.state.wheel.minIntervalSec = value;
        }
        this.persist();
        this.state = loadFavoritesState();
        Array.from(grid.querySelectorAll('.ydm-fav-wheel-field')).forEach((fieldEl, idx) => {
          const fieldInput = fieldEl.querySelector('input');
          const fieldKey = fields[idx]?.[0];
          if (fieldInput && fieldKey) fieldInput.value = String(this.state.wheel[fieldKey]);
        });
      });
      field.append(span, input);
      grid.appendChild(field);
    });

    this.wheelStatusEl = document.createElement('div');
    this.wheelStatusEl.className = 'ydm-fav-wheel-status';

    box.append(head, grid, this.wheelStatusEl);
    return box;
  }

  renderList() {
    if (!this.listEl) return;
    this.listEl.replaceChildren();
    const items = this.visibleItems();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'ydm-fav-empty';
      empty.textContent = t('favoritesEmpty');
      this.listEl.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      this.listEl.appendChild(this.createItemRow(item));
    });
  }

  createItemRow(item) {
    const row = document.createElement('div');
    row.className = 'ydm-fav-item';
    row.dataset.id = item.id;
    row.classList.toggle('is-global', !item.channel);

    const meta = document.createElement('div');
    meta.className = 'ydm-fav-item-meta';
    const channelLabel = item.channel === this.currentChannel()
      ? (currentChannelLabel() || item.channel)
      : item.channel;
    meta.textContent = item.channel
      ? t('favoritesScopeChannel').replace('{channel}', channelLabel)
      : t('favoritesScopeGlobal');

    const text = document.createElement('textarea');
    text.className = 'ydm-fav-item-text';
    text.rows = 2;
    text.maxLength = FAVORITE_TEXT_LIMIT;
    text.value = item.text;
    text.addEventListener('change', () => {
      const next = text.value.trim().slice(0, FAVORITE_TEXT_LIMIT);
      if (!next) {
        text.value = item.text;
        return;
      }
      item.text = next;
      this.persist();
    });

    const tools = document.createElement('div');
    tools.className = 'ydm-fav-item-tools';

    const shortcut = document.createElement('select');
    shortcut.className = 'ydm-fav-item-shortcut';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = t('favoritesShortcutNone');
    shortcut.appendChild(none);
    for (let i = 0; i <= 9; i += 1) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      shortcut.appendChild(opt);
    }
    shortcut.value = item.shortcut || '';
    shortcut.addEventListener('change', () => {
      const value = sanitizeFavoriteShortcut(shortcut.value);
      if (value) {
        this.state.items.forEach((entry) => {
          if (entry.id === item.id || entry.shortcut !== value) return;
          const sameScope = (entry.channel || null) === (item.channel || null);
          if (sameScope) entry.shortcut = null;
        });
      }
      item.shortcut = value;
      this.persist();
      this.renderList();
    });

    const scopeBtn = document.createElement('button');
    scopeBtn.type = 'button';
    scopeBtn.className = 'ydm-fav-item-scope';
    scopeBtn.textContent = item.channel ? t('favoritesMakeGlobal') : t('favoritesMakeChannel');
    scopeBtn.title = item.channel ? t('favoritesMakeGlobalHint') : t('favoritesMakeChannelHint');
    scopeBtn.addEventListener('click', () => {
      const channel = this.currentChannel();
      if (item.channel) {
        const result = setFavoriteGlobal(item.id, true);
        this.state = result.state;
        this.renderList();
        this.setStatus(t('favoritesScopedGlobal'), true);
        return;
      }
      if (!channel) {
        this.setStatus(t('favoritesNeedChannel'));
        return;
      }
      item.channel = channel;
      this.persist();
      this.renderList();
      this.setStatus(t('favoritesScopedChannel'), true);
    });

    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'ydm-fav-item-send';
    sendBtn.textContent = t('favoritesSend');
    sendBtn.addEventListener('click', () => this.sendFavorite(item));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ydm-fav-item-remove';
    removeBtn.textContent = t('favoritesRemove');
    removeBtn.addEventListener('click', () => {
      this.state.items = this.state.items.filter((entry) => entry.id !== item.id);
      this.persist();
      this.renderList();
    });

    tools.append(shortcut, scopeBtn, sendBtn, removeBtn);
    row.append(meta, text, tools);
    return row;
  }

  async sendFavorite(item) {
    const text = String(item?.text || '').trim();
    if (!text || this.sending) return false;
    this.sending = true;
    try {
      await sendYouTubeLiveChatMessage(text);
      this.setStatus(t('favoritesSent'), true);
      return true;
    } catch (error) {
      this.setStatus(chatSendErrorMessage(error));
      return false;
    } finally {
      this.sending = false;
    }
  }

  refreshWheelControls() {
    if (this.wheelToggleBtn) {
      this.wheelToggleBtn.textContent = this.wheel.running ? t('favoritesWheelStop') : t('favoritesWheelStart');
      this.wheelToggleBtn.classList.toggle('is-running', this.wheel.running);
    }
    if (!this.wheelStatusEl) return;
    if (!this.wheel.running) {
      this.wheelStatusEl.textContent = t('favoritesWheelIdle');
      return;
    }
    const leftSec = Math.max(0, Math.ceil((this.wheel.endsAt - Date.now()) / 1000));
    this.wheelStatusEl.textContent = t('favoritesWheelRunning')
      .replace('{sent}', String(this.wheel.sent))
      .replace('{max}', String(this.state.wheel.maxCount))
      .replace('{left}', String(leftSec));
  }

  startWheel() {
    this.state = loadFavoritesState();
    if (!this.visibleItems().length) {
      this.setStatus(t('favoritesEmpty'));
      return;
    }
    this.stopWheel(false);
    this.wheel.running = true;
    this.wheel.sent = 0;
    this.wheel.lastId = '';
    this.wheel.failStreak = 0;
    this.wheel.startedAt = Date.now();
    this.wheel.endsAt = this.wheel.startedAt + this.state.wheel.maxDurationSec * 1000;
    this.refreshWheelControls();
    clearInterval(this.wheel.statusTimer);
    this.wheel.statusTimer = setInterval(() => {
      if (!this.wheel.running) return;
      this.refreshWheelControls();
    }, 1000);
    // Send first message immediately (same as 独轮车.js), then cool down.
    this.scheduleWheelTick(0);
  }

  stopWheel(showStatus) {
    clearTimeout(this.wheel.timer);
    clearInterval(this.wheel.statusTimer);
    this.wheel.timer = null;
    this.wheel.statusTimer = null;
    const wasRunning = this.wheel.running;
    this.wheel.running = false;
    this.wheel.failStreak = 0;
    this.refreshWheelControls();
    if (showStatus && wasRunning) this.setStatus(t('favoritesWheelStopped'), true);
  }

  scheduleWheelTick(delayMs) {
    clearTimeout(this.wheel.timer);
    this.wheel.timer = setTimeout(() => this.runWheelTick(), Math.max(0, delayMs));
  }

  pickWheelItem(pool) {
    if (!pool.length) return null;
    if (pool.length === 1) return pool[0];
    // Avoid sending the same favorite twice in a row when possible.
    const choices = this.wheel.lastId
      ? pool.filter((item) => item.id !== this.wheel.lastId)
      : pool;
    const list = choices.length ? choices : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  nextWheelDelay(ok) {
    const minMs = Math.max(1500, Number(this.state.wheel.minIntervalSec) * 1000);
    const maxMs = Math.max(minMs, Number(this.state.wheel.maxIntervalSec) * 1000);
    let delay = minMs + Math.random() * (maxMs - minMs);
    // Back off after failures so rate limits / network blips cool down.
    if (!ok && this.wheel.failStreak > 0) {
      delay += Math.min(15000, this.wheel.failStreak * 2000);
    }
    return delay;
  }

  async runWheelTick() {
    if (!this.wheel.running) return;
    this.state = loadFavoritesState();
    if (Date.now() >= this.wheel.endsAt || this.wheel.sent >= this.state.wheel.maxCount) {
      this.stopWheel(true);
      return;
    }
    const pool = this.visibleItems();
    if (!pool.length) {
      this.stopWheel(true);
      return;
    }

    const item = this.pickWheelItem(pool);
    const ok = await this.sendFavorite(item);
    if (ok) {
      this.wheel.sent += 1;
      this.wheel.lastId = item?.id || '';
      this.wheel.failStreak = 0;
    } else {
      this.wheel.failStreak += 1;
      if (this.wheel.failStreak >= 5) {
        this.stopWheel(true);
        return;
      }
    }
    this.refreshWheelControls();

    if (!this.wheel.running) return;
    if (Date.now() >= this.wheel.endsAt || this.wheel.sent >= this.state.wheel.maxCount) {
      this.stopWheel(true);
      return;
    }

    this.scheduleWheelTick(this.nextWheelDelay(ok));
  }
}

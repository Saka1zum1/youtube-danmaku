class ChatClearButton {
  constructor({ onClear } = {}) {
    this.onClear = onClear;
    this.wrap = null;
    this.btn = null;
    this.retryTimer = null;
  }

  resetChatScroller(doc) {
    const offset = doc.querySelector(
      'yt-live-chat-item-list-renderer #item-offset, #item-offset.yt-live-chat-item-list-renderer',
    );
    if (offset) {
      // YouTube virtualizes with a tall #item-offset; wipe must collapse it or
      // new lines stay stuck in a tiny visible band.
      offset.style.height = '0px';
      offset.style.minHeight = '0px';
      offset.style.transform = 'translateY(0px)';
    }

    const scroller = doc.querySelector(
      'yt-live-chat-item-list-renderer #item-scroller, #item-scroller.yt-live-chat-item-list-renderer',
    );
    const stickBottom = () => {
      if (!scroller) return;
      scroller.scrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    };
    stickBottom();
    requestAnimationFrame(() => {
      if (offset && (!offset.children.length || offset.scrollHeight < 8)) {
        offset.style.height = '0px';
        offset.style.transform = 'translateY(0px)';
      } else if (offset) {
        offset.style.height = `${Math.max(offset.scrollHeight, 0)}px`;
        offset.style.transform = 'translateY(0px)';
      }
      stickBottom();
    });

    const list = doc.querySelector('yt-live-chat-item-list-renderer');
    if (!list) return;
    try {
      if (typeof list.scrollToBottom === 'function') list.scrollToBottom();
      if ('atBottom' in list) list.atBottom = true;
      if ('isAtBottom' in list) list.isAtBottom = true;
      if ('stickToBottom' in list) list.stickToBottom = true;
      if ('activeItems' in list && Array.isArray(list.activeItems)) list.activeItems = [];
      if ('visibleItems' in list && Array.isArray(list.visibleItems)) list.visibleItems = [];
      list.setAttribute('at-bottom', '');
      list.removeAttribute('has-user-scrolled');
      list.dispatchEvent?.(new Event('scroll'));
      if (typeof list.notifyPath === 'function') list.notifyPath('items');
      if (typeof list.requestUpdate === 'function') list.requestUpdate();
    } catch (_) {
      /* ignore host API differences */
    }
  }

  clearLiveChat() {
    const doc = getChatDocument() || document;
    const items = doc.querySelector(SELECTORS.chatItems);
    let removed = 0;

    if (items) {
      const nodes = [...items.querySelectorAll(SELECTORS.chatMessage)];
      removed = nodes.length;
      nodes.forEach((node) => node.remove());
      // Drop leftover empty wrappers that can keep a tall offset box.
      [...items.children].forEach((child) => {
        if (!child.matches?.(SELECTORS.chatMessage) && !child.querySelector?.(SELECTORS.chatMessage)) {
          if (child.id === 'item-offset') return;
          if (!child.children?.length && !child.textContent?.trim()) child.remove();
        }
      });
    } else {
      doc.querySelectorAll(SELECTORS.chatMessage).forEach((node) => {
        node.remove();
        removed += 1;
      });
    }

    this.resetChatScroller(doc);
    this.onClear?.(removed);
    return removed;
  }

  createButton(doc = document) {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'ydm-chat-clear-btn';
    btn.setAttribute('data-ydm-chat-clear', 'true');
    btn.setAttribute('aria-label', t('chatClear'));
    btn.setAttribute('title', t('chatClear'));
    appendMarkup(btn, ICON_CHAT_CLEAR);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearLiveChat();
    });
    return btn;
  }

  async mount() {
    if (this.wrap?.isConnected || this.btn?.isConnected) {
      this.refreshLabel();
      return;
    }

    const doc = getChatDocument() || document;
    ensureChatTranslateStyles(doc);
    if (doc.querySelector('[data-ydm-chat-clear="true"]')) return;

    const header = await waitForElement(
      '#chat-messages > yt-live-chat-header-renderer, yt-live-chat-header-renderer',
      doc,
      12000,
    );
    if (!header) return;

    const wrap = doc.createElement('div');
    wrap.className = 'ydm-chat-clear-wrap';
    wrap.setAttribute('data-ydm-chat-clear-wrap', 'true');
    this.btn = this.createButton(doc);
    wrap.appendChild(this.btn);
    this.wrap = wrap;

    const closeBtn = header.querySelector('#close-button');
    if (closeBtn) closeBtn.before(wrap);
    else header.appendChild(wrap);
  }

  refreshLabel() {
    if (!this.btn) return;
    this.btn.setAttribute('title', t('chatClear'));
    this.btn.setAttribute('aria-label', t('chatClear'));
  }

  remount() {
    if (this.wrap?.isConnected || this.btn?.isConnected) {
      this.refreshLabel();
      return;
    }
    this.wrap?.remove();
    this.btn?.remove();
    this.wrap = null;
    this.btn = null;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.mount(), 500);
  }

  destroy() {
    clearTimeout(this.retryTimer);
    this.wrap?.remove();
    if (this.btn && this.btn !== this.wrap) this.btn.remove();
    this.wrap = null;
    this.btn = null;
  }
}

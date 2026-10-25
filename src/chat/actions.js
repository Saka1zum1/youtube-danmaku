class ChatActions {
  constructor({ getSettings, danmakuEmitter, isActive, favoritesPanel = null }) {
    this.getSettings = getSettings;
    this.danmakuEmitter = danmakuEmitter;
    this.isActive = isActive;
    this.favoritesPanel = favoritesPanel;
    this.chatRoot = null;
    this.doc = null;
    this.panelObserver = null;
    this.boundContextMenu = (e) => this.handleContextMenu(e);
    this.boundClick = (e) => this.handleClick(e);
    this.boundDocClick = (e) => this.handleDocumentClick(e);
    this.busy = new WeakSet();
  }

  bind(chatRoot) {
    this.unbind();
    if (!chatRoot) return;
    this.chatRoot = chatRoot;
    this.doc = chatRoot.ownerDocument;
    ensureChatTranslateStyles(this.doc);
    this.chatRoot.addEventListener('contextmenu', this.boundContextMenu, true);
    this.chatRoot.addEventListener('click', this.boundClick, true);
    this.doc.addEventListener('click', this.boundDocClick, true);

    this.panelObserver = new MutationObserver(() => this.syncOpenSuperchatPanels());
    this.panelObserver.observe(this.doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'aria-hidden', 'opened', 'open', 'selected'],
    });
    this.syncOpenSuperchatPanels();
  }

  unbind() {
    this.panelObserver?.disconnect();
    this.panelObserver = null;
    if (this.chatRoot) {
      this.chatRoot.removeEventListener('contextmenu', this.boundContextMenu, true);
      this.chatRoot.removeEventListener('click', this.boundClick, true);
    }
    if (this.doc) {
      this.doc.removeEventListener('click', this.boundDocClick, true);
      closeChatOverlayUi(this.doc);
    }
    this.chatRoot = null;
    this.doc = null;
  }

  stop() {
    this.unbind();
  }

  handleDocumentClick(e) {
    if (!this.doc) return;
    if (e.target?.closest?.('.ydm-chat-menu, .ydm-sc-action-panel')) return;
    // Keep panels attached to open Super Chat cards; only close floating menus.
    this.doc.querySelectorAll('.ydm-chat-menu').forEach((node) => node.remove());
  }

  findMessage(target) {
    return target?.closest?.(SELECTORS.chatMessage) || null;
  }

  isSuperchatElement(msgEl) {
    return isPinnedChatElement(msgEl);
  }

  profileMenuItem(msgEl, { closeMenu = true } = {}) {
    // Resolve at click time so Polymer channel ids / @handles are available
    // for any target inside the message row (not only the avatar).
    return {
      icon: ICON_PROFILE,
      label: t('chatActionOpenProfile'),
      onClick: () => {
        if (closeMenu) closeChatOverlayUi(this.doc);
        const href = getYouTubeProfileUrl(msgEl);
        if (!href) return;
        window.open(href, '_blank', 'noopener,noreferrer');
      },
    };
  }

  handleContextMenu(e) {
    if (!this.isActive()) return;
    const msgEl = this.findMessage(e.target);
    if (!msgEl || !this.doc) return;

    e.preventDefault();
    e.stopPropagation();

    const translated = hasChatTranslation(msgEl);
    const items = [
      {
        icon: ICON_TRANSLATE,
        label: translated ? t('chatActionRetranslate') : t('chatActionTranslate'),
        onClick: () => {
          closeChatOverlayUi(this.doc);
          this.translateMessage(msgEl).catch(() => {});
        },
      },
      {
        icon: ICON_SPEECH_ON,
        label: t('chatActionSpeak'),
        onClick: () => {
          closeChatOverlayUi(this.doc);
          this.speakMessage(msgEl);
        },
      },
      {
        icon: ICON_DANMAKU_ON,
        label: t('chatActionDanmaku'),
        onClick: () => {
          closeChatOverlayUi(this.doc);
          this.sendDanmaku(msgEl);
        },
      },
      {
        icon: ICON_FAVORITE,
        label: t('chatActionFavorite'),
        onClick: () => {
          closeChatOverlayUi(this.doc);
          this.favoriteMessage(msgEl);
        },
      },
    ];
    items.push(this.profileMenuItem(msgEl));
    showChatContextMenu(this.doc, e.clientX, e.clientY, items);
  }

  handleClick(e) {
    if (!this.isActive()) return;
    if (e.button !== 0) return;
    if (e.target?.closest?.('.ydm-chat-menu, .ydm-sc-action-panel, .ydm-chat-translation')) return;

    const msgEl = this.findMessage(e.target);
    if (!msgEl || !this.isSuperchatElement(msgEl)) return;

    e.preventDefault();
    e.stopPropagation();
    this.openSuperchatPanel(msgEl);
  }

  openSuperchatPanel(msgEl) {
    if (!this.doc || !msgEl?.isConnected) return;
    const translated = hasChatTranslation(msgEl);
    const items = [
      {
        icon: ICON_TRANSLATE,
        label: translated ? t('chatActionRetranslate') : t('chatActionTranslate'),
        onClick: () => {
          this.translateMessage(msgEl).catch(() => {});
        },
      },
      {
        icon: ICON_SPEECH_ON,
        label: t('chatActionSpeak'),
        onClick: () => this.speakMessage(msgEl),
      },
      {
        icon: ICON_DANMAKU_ON,
        label: t('chatActionDanmaku'),
        onClick: () => this.sendDanmaku(msgEl),
      },
      {
        icon: ICON_FAVORITE,
        label: t('chatActionFavorite'),
        onClick: () => this.favoriteMessage(msgEl),
      },
    ];
    items.push(this.profileMenuItem(msgEl, { closeMenu: false }));
    showSuperchatActionPanel(msgEl, items);
  }

  findOpenSuperchatCards() {
    if (!this.doc) return [];
    // History / detail popups (not the regular inline chat list).
    const selectors = [
      '#chat-messages yt-live-chat-paid-message-renderer',
      '#chat-messages yt-live-chat-paid-sticker-renderer',
      '#chat-messages yt-live-chat-membership-item-renderer',
      'yt-live-chat-banner-manager yt-live-chat-paid-message-renderer',
      'yt-live-chat-banner-manager yt-live-chat-paid-sticker-renderer',
      'yt-live-chat-banner-manager yt-live-chat-membership-item-renderer',
      'tp-yt-paper-dialog yt-live-chat-paid-message-renderer',
      'tp-yt-paper-dialog yt-live-chat-paid-sticker-renderer',
      'tp-yt-paper-dialog yt-live-chat-membership-item-renderer',
      'yt-live-chat-ticker-paid-message-item-renderer[aria-selected="true"] yt-live-chat-paid-message-renderer',
      'yt-live-chat-ticker-paid-message-item-renderer[selected] yt-live-chat-paid-message-renderer',
      'yt-live-chat-ticker-paid-message-item-renderer #card:not([hidden]) yt-live-chat-paid-message-renderer',
      'yt-live-chat-ticker-sponsor-item-renderer[aria-selected="true"] yt-live-chat-membership-item-renderer',
      'yt-live-chat-ticker-sponsor-item-renderer[selected] yt-live-chat-membership-item-renderer',
    ];

    const found = [];
    const seen = new Set();
    for (const selector of selectors) {
      this.doc.querySelectorAll(selector).forEach((node) => {
        const msg = node.matches?.(SELECTORS.chatMessage)
          ? node
          : node.querySelector?.(SELECTORS.chatMessage) || node;
        if (!msg || seen.has(msg) || !msg.isConnected) return;
        if (!this.isSuperchatElement(msg)) return;
        const style = this.doc.defaultView?.getComputedStyle?.(msg);
        if (style && (style.display === 'none' || style.visibility === 'hidden')) return;
        seen.add(msg);
        found.push(msg);
      });
    }
    return found;
  }

  syncOpenSuperchatPanels() {
    if (!this.doc || !this.isActive()) return;
    for (const msgEl of this.findOpenSuperchatCards()) {
      if (msgEl.querySelector('.ydm-sc-action-panel')) continue;
      this.openSuperchatPanel(msgEl);
    }
  }

  async translateMessage(msgEl) {
    if (!msgEl?.isConnected || this.busy.has(msgEl)) return;
    const parsed = readChatMessage(msgEl);
    if (!parsed) return;

    const settings = this.getSettings();
    const sourceParts = parsed.superchat
      ? (parsed.bodyParts || parsed.parts)
      : parsed.parts;
    const sourceText = partsToText(sourceParts) || parsed.message;
    const shielded = shieldEmoteParts(sourceParts);
    const retryAfterFailure = hasChatTranslationError(msgEl) || hasChatTranslation(msgEl);
    this.busy.add(msgEl);
    setChatTranslationStatus(msgEl, 'pending', t('chatActionTranslating'));

    try {
      const outcome = await translateMessagesManual(
        shielded.text,
        settings.translateTargetLang,
        settings.translateProvider,
        { bypassCache: retryAfterFailure },
      );
      if (!msgEl.isConnected) return;
      const rendered = outcome?.trim() ? outcome : '';
      if (!rendered || rendered === shielded.text || rendered === sourceText) {
        setChatTranslationStatus(msgEl, 'error', t('chatActionTranslateFailed'));
        return;
      }
      const parts = stripAmountFromParts(
        restoreEmoteParts(rendered, shielded.emotes) || [{ type: 'text', text: rendered }],
        parsed.amount,
      );
      const message = partsToText(parts) || stripAmountFromText(rendered, parsed.amount);
      if (!message || message === sourceText) {
        setChatTranslationStatus(msgEl, 'error', t('chatActionTranslateFailed'));
        return;
      }
      applyChatTranslation(msgEl, message, sourceText);
      if (msgEl.querySelector('.ydm-sc-action-panel')) this.openSuperchatPanel(msgEl);
    } catch (_) {
      if (msgEl.isConnected) {
        setChatTranslationStatus(msgEl, 'error', t('chatActionTranslateFailed'));
      }
    } finally {
      this.busy.delete(msgEl);
    }
  }

  speakMessage(msgEl) {
    const parsed = readChatMessage(msgEl);
    if (!parsed) return;
    const translated = getChatTranslationText(msgEl);
    speakTextNow(translated || parsed.message);
  }

  favoriteMessage(msgEl) {
    const parsed = readChatMessage(msgEl);
    const text = String(
      partsToFavoriteText(parsed?.bodyParts || parsed?.parts || [])
      || parsed?.message
      || '',
    ).trim();
    if (!text) return;
    if (this.favoritesPanel?.addFromText) {
      this.favoritesPanel.addFromText(text);
      if (!this.favoritesPanel.isOpen && this.favoritesPanel.btn) {
        this.favoritesPanel.open(this.favoritesPanel.btn);
      }
      return;
    }
    addFavoriteText(text);
  }

  sendDanmaku(msgEl) {
    if (!this.danmakuEmitter || !this.isActive()) return;
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const parsed = readChatMessage(msgEl);
    if (!parsed) return;
    if (messageMatchesBlock(parsed.message, settings.blockKeywords)) return;

    const translated = getChatTranslationText(msgEl);
    const amount = parsed.amount || '';
    const bodyParts = translated
      ? stripAmountFromParts([{ type: 'text', text: translated }], amount)
      : (parsed.bodyParts || parsed.parts);
    const bodyText = partsToText(bodyParts) || stripAmountFromText(translated || parsed.message, amount);
    const message = amount ? `${amount} ${bodyText}`.trim() : (translated || parsed.message);
    if (messageMatchesBlock(parsed.message, settings.blockKeywords)) return;
    if (messageMatchesBlock(message, settings.blockKeywords)
      || messageMatchesBlock(bodyText, settings.blockKeywords)) return;

    const textParts = amount
      ? [{ type: 'text', text: `${amount} ` }, ...bodyParts]
      : bodyParts;

    this.danmakuEmitter.enqueue({
      username: parsed.username,
      usernameColor: parsed.usernameColor,
      profileUrl: parsed.profileUrl,
      avatarUrl: parsed.avatarUrl || '',
      originalMessage: parsed.message,
      parts: textParts,
      bodyParts,
      message,
      amount,
      translated: !!translated && translated !== parsed.message,
      superchat: !!parsed.superchat,
      superchatStyle: parsed.superchatStyle || null,
    });
  }
}

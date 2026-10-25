class ChatObserver {
  constructor({ getSettings, danmakuEmitter, translateQueue, isActive, favoritesPanel = null }) {
    this.getSettings = getSettings;
    this.danmakuEmitter = danmakuEmitter;
    this.translateQueue = translateQueue;
    this.isActive = isActive;
    this.favoritesPanel = favoritesPanel;
    this.observer = null;
    this.chatRoot = null;
    this.readyAt = 0;
    this.stopped = false;
    this.starting = false;
    this.nextTryAt = 0;
    this.seenIds = new Set();
    this.chatActions = new ChatActions({
      getSettings,
      danmakuEmitter,
      isActive,
      favoritesPanel,
    });
  }

  setFavoritesPanel(panel) {
    this.favoritesPanel = panel;
    if (this.chatActions) this.chatActions.favoritesPanel = panel;
  }

  isConnected() {
    return !!this.chatRoot?.isConnected;
  }

  async start() {
    if (this.starting || this.isConnected()) return;
    if (Date.now() < this.nextTryAt) return;

    this.starting = true;
    this.stopped = false;
    this.observer?.disconnect();
    this.observer = null;
    this.chatActions?.unbind();

    try {
      const chatRoot = await waitForChatList(() => this.stopped);
      if (this.stopped) return;
      if (!chatRoot) {
        this.nextTryAt = Date.now() + 4000;
        console.warn('[YDM] Live chat list not found');
        return;
      }

      this.chatRoot = chatRoot;
      markExistingMessages(this.chatRoot);
      this.readyAt = Date.now();
      this.chatActions.bind(this.chatRoot);

      this.observer = new MutationObserver((mutations) => {
        if (!this.isActive()) return;
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent) this.handleNode(parent);
            continue;
          }
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              if (node.parentElement) this.handleNode(node.parentElement);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleNode(node);
            }
          }
        }
      });

      this.observer.observe(this.chatRoot, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      console.log('[YDM] Chat observer started');
    } finally {
      this.starting = false;
    }
  }

  stop() {
    this.stopped = true;
    this.observer?.disconnect();
    this.observer = null;
    this.chatActions?.stop();
    this.chatRoot = null;
    this.seenIds.clear();
  }

  remember(msgEl) {
    const id = msgEl.id;
    if (!id) return;
    this.seenIds.add(id);
    if (this.seenIds.size > 2000) {
      const oldest = this.seenIds.values().next().value;
      this.seenIds.delete(oldest);
    }
  }

  shouldEmit(msgEl) {
    if (!this.isActive()) return false;
    if (msgEl.classList.contains('ydm-processed')) return false;
    if (msgEl.id && this.seenIds.has(msgEl.id)) {
      msgEl.classList.add('ydm-processed');
      return false;
    }

    if (Date.now() - this.readyAt < WARMUP_MS) {
      msgEl.classList.add('ydm-processed');
      this.remember(msgEl);
      return false;
    }

    if (!isLiveMessage(msgEl, this.chatRoot)) {
      msgEl.classList.add('ydm-processed');
      this.remember(msgEl);
      return false;
    }

    return true;
  }

  handleNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const found = [];
    if (node.matches?.(SELECTORS.chatMessage)) found.push(node);
    if (node.querySelectorAll) found.push(...node.querySelectorAll(SELECTORS.chatMessage));
    const parentMessage = node.closest?.(SELECTORS.chatMessage);
    if (parentMessage) found.push(parentMessage);

    const seen = new Set();
    for (const msgEl of found) {
      if (seen.has(msgEl)) continue;
      seen.add(msgEl);
      ensureAuthorProfileLink(msgEl);
      if (!this.shouldEmit(msgEl)) continue;
      const parsed = parseChatMessage(msgEl);
      if (!parsed) continue;
      this.remember(msgEl);
      this.emitDanmaku(parsed, msgEl);
    }
  }

  emitDanmaku(parsed, msgEl) {
    const settings = this.getSettings();
    if (!this.isActive()) return;

    const wantDanmaku = !!settings.enabled;
    const wantChatTranslate = !!settings.translateEnabled && !!settings.translateInChat;
    if (!wantDanmaku && !wantChatTranslate) return;

    if (messageMatchesBlock(parsed.message, settings.blockKeywords)) {
      removeChatTranslation(msgEl);
      return;
    }

    // Super Chat: translate body only so the amount badge is not duplicated.
    const sourceParts = parsed.superchat
      ? (parsed.bodyParts || parsed.parts)
      : parsed.parts;
    const shielded = shieldEmoteParts(sourceParts);
    const base = {
      username: parsed.username,
      usernameColor: parsed.usernameColor,
      profileUrl: parsed.profileUrl,
      avatarUrl: parsed.avatarUrl || '',
      originalMessage: parsed.message,
      parts: parsed.parts,
      bodyParts: parsed.bodyParts || parsed.parts,
      amount: parsed.amount || '',
      superchat: !!parsed.superchat,
      superchatStyle: parsed.superchatStyle || null,
    };

    if (!settings.translateEnabled) {
      removeChatTranslation(msgEl);
      if (wantDanmaku) {
        this.danmakuEmitter.enqueue({
          ...base,
          message: parsed.message,
          translated: false,
        });
      }
      return;
    }

    this.translateQueue.enqueue(shielded.text, (translated, original) => {
      if (!this.isActive()) return;
      const latest = this.getSettings();
      const rendered = translated?.trim() ? translated : original;
      const bodyParts = stripAmountFromParts(
        restoreEmoteParts(rendered, shielded.emotes) || sourceParts,
        parsed.amount,
      );
      const bodyText = partsToText(bodyParts) || stripAmountFromText(rendered, parsed.amount);
      const message = parsed.amount ? `${parsed.amount} ${bodyText}`.trim() : bodyText;
      const parts = parsed.amount
        ? [{ type: 'text', text: `${parsed.amount} ` }, ...bodyParts]
        : bodyParts;
      if (messageMatchesBlock(parsed.message, latest.blockKeywords)
        || messageMatchesBlock(message, latest.blockKeywords)
        || messageMatchesBlock(bodyText, latest.blockKeywords)) {
        removeChatTranslation(msgEl);
        return;
      }

      if (latest.translateEnabled && latest.translateInChat) {
        applyChatTranslation(msgEl, bodyText, partsToText(sourceParts) || parsed.message);
      } else {
        removeChatTranslation(msgEl);
      }

      if (!latest.enabled) return;
      const didTranslate = bodyText !== (partsToText(sourceParts) || '');
      this.danmakuEmitter.enqueue({
        ...base,
        parts,
        bodyParts,
        amount: parsed.amount || '',
        message,
        translated: didTranslate,
      });
    });
  }
}

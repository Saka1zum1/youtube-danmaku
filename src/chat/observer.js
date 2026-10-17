class ChatObserver {
  constructor({ getSettings, danmakuEmitter, translateQueue, isActive }) {
    this.getSettings = getSettings;
    this.danmakuEmitter = danmakuEmitter;
    this.translateQueue = translateQueue;
    this.isActive = isActive;
    this.observer = null;
    this.chatRoot = null;
    this.readyAt = 0;
    this.stopped = false;
    this.starting = false;
    this.nextTryAt = 0;
    this.seenIds = new Set();
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
      if (!this.shouldEmit(msgEl)) continue;
      const parsed = parseChatMessage(msgEl);
      if (!parsed) continue;
      this.remember(msgEl);
      this.emitDanmaku(parsed);
    }
  }

  emitDanmaku(parsed) {
    const settings = this.getSettings();
    if (!this.isActive() || !settings.enabled) return;

    if (messageMatchesBlock(parsed.message, settings.blockKeywords)) return;

    const shielded = shieldEmoteParts(parsed.parts);
    const base = {
      username: parsed.username,
      usernameColor: parsed.usernameColor,
      profileUrl: parsed.profileUrl,
      originalMessage: parsed.message,
      parts: parsed.parts,
    };

    if (!settings.translateEnabled) {
      this.danmakuEmitter.enqueue({
        ...base,
        message: parsed.message,
        translated: false,
      });
      return;
    }

    this.translateQueue.enqueue(shielded.text, (translated, original) => {
      if (!this.isActive()) return;
      const latest = this.getSettings();
      const rendered = translated?.trim() ? translated : original;
      const parts = restoreEmoteParts(rendered, shielded.emotes) || parsed.parts;
      const message = partsToText(parts) || parsed.message;
      if (messageMatchesBlock(parsed.message, latest.blockKeywords)) return;
      if (messageMatchesBlock(message, latest.blockKeywords)) return;
      this.danmakuEmitter.enqueue({
        ...base,
        parts,
        message,
        translated: message !== parsed.message,
      });
    });
  }
}

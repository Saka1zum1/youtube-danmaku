class ControlButton {
  constructor({
    onToggleDanmaku,
    onTogglePanel,
    onToggleSpeech,
    onToggleHistory,
    onExpandChat,
    getSettings,
    isPanelOpen,
    isSpeechPanelOpen,
    isHistoryPanelOpen,
    isChatCollapsed,
  }) {
    this.onToggleDanmaku = onToggleDanmaku;
    this.onTogglePanel = onTogglePanel;
    this.onToggleSpeech = onToggleSpeech;
    this.onToggleHistory = onToggleHistory;
    this.onExpandChat = onExpandChat;
    this.getSettings = getSettings;
    this.isPanelOpen = isPanelOpen;
    this.isSpeechPanelOpen = isSpeechPanelOpen;
    this.isHistoryPanelOpen = isHistoryPanelOpen;
    this.isChatCollapsed = isChatCollapsed || (() => false);
    this.wrap = null;
    this.danmakuBtn = null;
    this.speechBtn = null;
    this.historyBtn = null;
    this.settingsBtn = null;
    this.chatExpandBtn = null;
    this.controlsGroup = null;
    this.mounting = false;
  }

  createBtn(className, label, html) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ydm-control-btn ${className}`;
    btn.setAttribute('aria-label', label);
    appendMarkup(btn, html);
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    return btn;
  }

  async mount() {
    if (this.mounting || this.wrap?.isConnected) return;
    this.mounting = true;

    try {
      this.controlsGroup = await waitForElement(SELECTORS.playerControls, document, 15000);
      if (!this.controlsGroup || this.wrap?.isConnected) return;
      if (this.controlsGroup.querySelector('.ydm-controls-wrap')) return;

      this.wrap = document.createElement('div');
      this.wrap.className = 'ydm-controls-wrap';

      this.danmakuBtn = this.createBtn('ydm-danmaku-btn', t('danmakuToggle'), `
        <span class="ydm-icon ydm-icon-on">${ICON_DANMAKU_ON}</span>
        <span class="ydm-icon ydm-icon-off">${ICON_DANMAKU_OFF}</span>
      `);
      this.danmakuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onToggleDanmaku();
      });

      this.speechBtn = this.createBtn('ydm-speech-btn', t('speechToggle'), `
        <span class="ydm-icon ydm-icon-on">${ICON_SPEECH_ON}</span>
        <span class="ydm-icon ydm-icon-mute">${ICON_SPEECH_MUTE}</span>
        <span class="ydm-icon ydm-icon-off">${ICON_SPEECH_OFF}</span>
      `);
      this.speechBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onToggleSpeech(this.speechBtn);
      });

      this.historyBtn = this.createBtn('ydm-history-btn', t('historyToggle'), ICON_DOWNLOAD);
      this.historyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onToggleHistory(this.historyBtn);
      });

      this.settingsBtn = this.createBtn('ydm-settings-btn', t('settingsToggle'), ICON_SETTINGS);
      this.settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onTogglePanel(this.settingsBtn);
      });

      this.chatExpandBtn = this.createBtn('ydm-chat-expand-control-btn', t('chatExpand'), ICON_CHAT_EXPAND);
      this.chatExpandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onExpandChat?.();
      });

      this.wrap.append(
        this.danmakuBtn,
        this.settingsBtn,
        this.speechBtn,
        this.historyBtn,
        this.chatExpandBtn,
      );
      const first = this.controlsGroup.firstChild;
      if (first) this.controlsGroup.insertBefore(this.wrap, first);
      else this.controlsGroup.appendChild(this.wrap);

      this.updateDanmakuState();
      this.updateSpeechState();
      this.updateHistoryState();
      this.updatePanelState();
      this.updateChatCollapsedState(this.isChatCollapsed());
    } finally {
      this.mounting = false;
    }
  }

  remount() {
    if (this.wrap?.isConnected) {
      this.updateChatCollapsedState(this.isChatCollapsed());
      return;
    }
    const existing = document.querySelector('.ydm-controls-wrap');
    if (existing?.isConnected && existing.querySelector('.ydm-danmaku-btn') && existing.querySelector('.ydm-speech-btn') && existing.querySelector('.ydm-history-btn')) {
      this.wrap = existing;
      this.danmakuBtn = existing.querySelector('.ydm-danmaku-btn');
      this.speechBtn = existing.querySelector('.ydm-speech-btn');
      this.historyBtn = existing.querySelector('.ydm-history-btn');
      this.settingsBtn = existing.querySelector('.ydm-settings-btn');
      this.chatExpandBtn = existing.querySelector('.ydm-chat-expand-control-btn');
      if (!this.chatExpandBtn) {
        this.chatExpandBtn = this.createBtn('ydm-chat-expand-control-btn', t('chatExpand'), ICON_CHAT_EXPAND);
        this.chatExpandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onExpandChat?.();
        });
        existing.appendChild(this.chatExpandBtn);
      }
      this.updateSpeechState();
      this.updateHistoryState();
      this.updateChatCollapsedState(this.isChatCollapsed());
      return;
    }
    existing?.remove();
    this.wrap = null;
    this.danmakuBtn = null;
    this.speechBtn = null;
    this.historyBtn = null;
    this.settingsBtn = null;
    this.chatExpandBtn = null;
    this.mount();
  }

  updateDanmakuState() {
    if (!this.danmakuBtn) return;
    const enabled = this.getSettings().enabled;
    this.danmakuBtn.classList.toggle('ydm-danmaku-enabled', enabled);
    this.danmakuBtn.classList.toggle('ydm-danmaku-disabled', !enabled);
    this.danmakuBtn.title = enabled ? t('danmakuOn') : t('danmakuOff');
    this.danmakuBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  updateSpeechState() {
    if (!this.speechBtn) return;
    const settings = this.getSettings();
    const enabled = !!settings.speechEnabled;
    const muted = enabled && Number(settings.speechVolume) <= 0;
    const current = !enabled ? 'off' : muted ? 'mute' : 'on';
    this.speechBtn.classList.toggle('ydm-speech-on', current === 'on');
    this.speechBtn.classList.toggle('ydm-speech-mute', current === 'mute');
    this.speechBtn.classList.toggle('ydm-speech-off', current === 'off');
    this.speechBtn.classList.toggle('ydm-active', !!this.isSpeechPanelOpen?.());
    const label = current === 'on' ? t('speechOn') : current === 'mute' ? t('speechMute') : t('speechOff');
    this.speechBtn.title = label;
    this.speechBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    this.speechBtn.setAttribute('aria-expanded', this.isSpeechPanelOpen?.() ? 'true' : 'false');
  }

  updateHistoryState() {
    if (!this.historyBtn) return;
    const open = !!this.isHistoryPanelOpen?.();
    this.historyBtn.classList.toggle('ydm-active', open);
    this.historyBtn.title = t('historyToggle');
    this.historyBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  updatePanelState() {
    if (!this.settingsBtn) return;
    this.settingsBtn.classList.toggle('ydm-active', this.isPanelOpen());
    this.settingsBtn.setAttribute('aria-expanded', this.isPanelOpen() ? 'true' : 'false');
    this.updateSpeechState();
    this.updateHistoryState();
    this.updateChatCollapsedState(this.isChatCollapsed());
  }

  updateChatCollapsedState(collapsed = this.isChatCollapsed()) {
    if (!this.chatExpandBtn) return;
    const show = !!collapsed;
    this.chatExpandBtn.hidden = !show;
    this.chatExpandBtn.classList.toggle('ydm-visible', show);
    this.chatExpandBtn.title = t('chatExpand');
    this.chatExpandBtn.setAttribute('aria-label', t('chatExpand'));
    this.chatExpandBtn.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  destroy() {
    this.wrap?.remove();
    this.wrap = null;
    this.danmakuBtn = null;
    this.speechBtn = null;
    this.historyBtn = null;
    this.settingsBtn = null;
    this.chatExpandBtn = null;
    this.mounting = false;
  }
}

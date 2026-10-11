class ControlButton {
  constructor({ onToggleDanmaku, onTogglePanel, getSettings, isPanelOpen }) {
    this.onToggleDanmaku = onToggleDanmaku;
    this.onTogglePanel = onTogglePanel;
    this.getSettings = getSettings;
    this.isPanelOpen = isPanelOpen;
    this.wrap = null;
    this.danmakuBtn = null;
    this.settingsBtn = null;
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

      this.settingsBtn = this.createBtn('ydm-settings-btn', t('settingsToggle'), ICON_SETTINGS);
      this.settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onTogglePanel(this.settingsBtn);
      });

      this.wrap.append(this.danmakuBtn, this.settingsBtn);
      const first = this.controlsGroup.firstChild;
      if (first) this.controlsGroup.insertBefore(this.wrap, first);
      else this.controlsGroup.appendChild(this.wrap);

      this.updateDanmakuState();
      this.updatePanelState();
    } finally {
      this.mounting = false;
    }
  }

  remount() {
    if (this.wrap?.isConnected) return;
    const existing = document.querySelector('.ydm-controls-wrap');
    if (existing?.isConnected && existing.querySelector('.ydm-danmaku-btn')) {
      this.wrap = existing;
      this.danmakuBtn = existing.querySelector('.ydm-danmaku-btn');
      this.settingsBtn = existing.querySelector('.ydm-settings-btn');
      return;
    }
    this.wrap = null;
    this.danmakuBtn = null;
    this.settingsBtn = null;
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

  updatePanelState() {
    if (!this.settingsBtn) return;
    this.settingsBtn.classList.toggle('ydm-active', this.isPanelOpen());
    this.settingsBtn.setAttribute('aria-expanded', this.isPanelOpen() ? 'true' : 'false');
  }

  destroy() {
    this.wrap?.remove();
    this.wrap = null;
    this.danmakuBtn = null;
    this.settingsBtn = null;
    this.mounting = false;
  }
}

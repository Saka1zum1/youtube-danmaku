class SettingsPanel {
  constructor({ settings, onChange, onClose }) {
    this.settings = settings;
    this.onChange = onChange;
    this.onClose = onClose;
    this.balloon = null;
    this.anchor = null;
    this.isOpen = false;
    this.boundReposition = () => this.reposition();
    this.boundOutsideClick = (e) => this.handleOutsideClick(e);
  }

  toggle(anchor) {
    if (this.isOpen && this.anchor === anchor) this.close();
    else this.open(anchor);
  }

  open(anchor) {
    this.close();
    this.anchor = anchor;
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

    window.removeEventListener('resize', this.boundReposition);
    document.removeEventListener('fullscreenchange', this.boundReposition);
    document.removeEventListener('webkitfullscreenchange', this.boundReposition);
    document.removeEventListener('scroll', this.boundReposition, true);
    document.removeEventListener('click', this.boundOutsideClick, true);
    if (wasOpen) this.onClose?.();
  }

  handleOutsideClick(e) {
    if (!this.balloon || !this.isOpen) return;
    if (this.balloon.contains(e.target)) return;
    if (this.anchor?.contains(e.target)) return;
    this.close();
  }

  reposition() {
    if (!this.balloon || !this.anchor) return;

    const mountTarget = getFullscreenElement() || document.body;
    if (this.balloon.parentElement !== mountTarget) {
      mountTarget.appendChild(this.balloon);
    }

    const rect = this.anchor.getBoundingClientRect();
    const width = 300;
    const gap = 8;
    const height = this.balloon.offsetHeight;
    let left = rect.right - width;
    let top = rect.top - height - gap;

    left = clamp(left, 8, window.innerWidth - width - 8);
    if (top < 8) top = rect.bottom + gap;

    Object.assign(this.balloon.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      zIndex: '100000',
    });
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    saveSettings(this.settings);
    this.onChange(this.settings);
  }

  createToggle(label, key) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--toggle';

    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const switchWrap = document.createElement('label');
    switchWrap.className = 'ydm-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!this.settings[key];

    const slider = document.createElement('span');
    slider.className = 'ydm-switch-slider';

    input.addEventListener('change', () => {
      this.updateSetting(key, input.checked);
    });

    switchWrap.append(input, slider);
    row.append(labelEl, switchWrap);
    return row;
  }

  createRange(label, key, min, max, step, format) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-field-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'ydm-balloon-value';
    valueSpan.textContent = format(this.settings[key]);

    header.append(labelEl, valueSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'ydm-balloon-range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(this.settings[key]);
    input.addEventListener('input', () => {
      const val = Number(input.value);
      valueSpan.textContent = format(val);
      this.updateSetting(key, val);
    });

    row.append(header, input);
    return row;
  }

  createSelect(label, key, options) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const labelEl = document.createElement('div');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const select = document.createElement('select');
    select.className = 'ydm-balloon-select';
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === this.settings[key]) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => {
      this.updateSetting(key, select.value);
    });

    row.append(labelEl, select);
    return row;
  }

  render() {
    this.balloon = document.createElement('div');
    this.balloon.className = 'ydm-balloon';
    this.balloon.setAttribute('role', 'dialog');
    this.balloon.setAttribute('aria-label', t('panelTitle'));
    this.balloon.addEventListener('click', (e) => e.stopPropagation());
    this.balloon.addEventListener('pointerdown', (e) => e.stopPropagation());

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';

    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('panelTitle');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-balloon-close';
    closeBtn.setAttribute('aria-label', t('panelClose'));
    closeBtn.textContent = t('panelClose');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'ydm-balloon-body';
    body.append(
      this.createRange(t('scrollSpeed'), 'speed', 1, 10, 1, (v) => String(v)),
      this.createRange(t('fontSize'), 'fontSize', 14, 40, 1, (v) => `${v}px`),
      this.createRange(t('danmakuOpacity'), 'opacity', 10, 100, 5, (v) => `${v}%`),
      this.createSelect(t('fontFamily'), 'fontFamily', getFontOptions()),
      this.createSelect(t('scrollArea'), 'scrollArea', getScrollAreaOptions()),
      this.createDivider(),
      this.createToggle(t('superchatPinned'), 'superchatPinned'),
      this.createSelect(t('superchatPosition'), 'superchatPosition', getSuperchatPositionOptions()),
      this.createRange(t('superchatDuration'), 'superchatDuration', 2, 15, 1, (v) => `${v} ${t('speechSeconds')}`),
      this.createSelect(t('superchatAnimation'), 'superchatAnimation', getSuperchatAnimationOptions()),
      this.createDivider(),
      this.createKeywordBlock(),
      this.createDivider(),
      this.createToggle(t('translateEnable'), 'translateEnabled'),
      this.createToggle(t('translateInChat'), 'translateInChat'),
      this.createSelect(t('translateProvider'), 'translateProvider', getTranslateProviderOptions()),
      this.createSelect(t('translateTarget'), 'translateTargetLang', getTranslateLangOptions()),
      this.createRange(t('translateSpeed'), 'translateSpeed', 1, 10, 1, (v) => `${v} ${t('translateSpeedUnit')}`),
    );

    this.balloon.append(header, body);
    const mountTarget = getFullscreenElement() || document.body;
    mountTarget.appendChild(this.balloon);
  }

  createKeywordBlock() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const label = document.createElement('div');
    label.className = 'ydm-balloon-label';
    label.textContent = t('blockKeywords');

    const hint = document.createElement('div');
    hint.className = 'ydm-keyword-hint';
    hint.textContent = t('blockKeywordHint');

    const form = document.createElement('div');
    form.className = 'ydm-keyword-add';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-balloon-input';
    input.maxLength = 40;
    input.placeholder = t('blockKeywordPlaceholder');
    input.setAttribute('aria-label', t('blockKeywords'));

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ydm-keyword-add-btn';
    addBtn.textContent = t('blockKeywordAdd');

    const list = document.createElement('div');
    list.className = 'ydm-keyword-list';

    const renderList = () => {
      list.replaceChildren();
      for (const word of this.settings.blockKeywords || []) {
        const chip = document.createElement('span');
        chip.className = 'ydm-keyword-chip';

        const text = document.createElement('span');
        text.textContent = word;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'ydm-keyword-remove';
        remove.setAttribute('aria-label', `${t('blockKeywordRemove')} ${word}`);
        remove.textContent = '×';
        remove.addEventListener('click', (e) => {
          e.stopPropagation();
          const next = (this.settings.blockKeywords || []).filter((item) => item !== word);
          this.updateSetting('blockKeywords', next);
          renderList();
        });

        chip.append(text, remove);
        list.appendChild(chip);
      }
    };

    const addWord = () => {
      const word = input.value.trim().slice(0, 40);
      if (!word) return;
      const current = this.settings.blockKeywords || [];
      if (current.some((item) => item.toLowerCase() === word.toLowerCase())) {
        input.value = '';
        return;
      }
      if (current.length >= 50) return;
      this.updateSetting('blockKeywords', [...current, word]);
      input.value = '';
      renderList();
    };

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addWord();
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Enter') return;
      e.preventDefault();
      addWord();
    });

    form.append(input, addBtn);
    row.append(label, hint, form, list);
    renderList();
    return row;
  }

  createDivider() {
    const div = document.createElement('div');
    div.className = 'ydm-balloon-divider';
    return div;
  }
}

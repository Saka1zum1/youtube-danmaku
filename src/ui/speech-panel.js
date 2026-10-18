class SpeechPanel {
  constructor({ settings, onChange, onClose }) {
    this.settings = settings;
    this.onChange = onChange;
    this.onClose = onClose;
    this.balloon = null;
    this.anchor = null;
    this.isOpen = false;
    this.langSelect = null;
    this.voiceSelect = null;
    this.boundReposition = () => this.reposition();
    this.boundOutsideClick = (e) => this.handleOutsideClick(e);
    this.boundVoices = () => this.fillVoices();
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
    window.speechSynthesis?.addEventListener('voiceschanged', this.boundVoices);

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
    this.langSelect = null;
    this.voiceSelect = null;
    window.speechSynthesis?.removeEventListener('voiceschanged', this.boundVoices);
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
    const width = 320;
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
    if ((key === 'speechEnabled' && !value) || (key === 'speechVolume' && Number(value) <= 0)) {
      cancelSpeech();
    }
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

  render() {
    this.balloon = document.createElement('div');
    this.balloon.className = 'ydm-balloon ydm-speech-panel';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';

    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('speechPanelTitle');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-balloon-close';
    closeBtn.textContent = t('panelClose');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'ydm-balloon-body ydm-balloon-body--speech';

    if (!speechSupported()) {
      const note = document.createElement('p');
      note.className = 'ydm-speech-note';
      note.textContent = t('speechUnsupported');
      body.appendChild(note);
      this.balloon.append(header, body);
      (getFullscreenElement() || document.body).appendChild(this.balloon);
      return;
    }

    body.append(
      this.createToggle(t('speechEnable'), 'speechEnabled'),
      this.createTest(),
      this.createDivider(),
      this.createRange(t('speechVolume'), 'speechVolume', 0, 100, 5, (v) => `${v}%`),
      this.createRange(t('speechPitch'), 'speechPitch', 0, 200, 10, (v) => `${v}%`),
      this.createVoices(),
      this.createDivider(),
      this.createRange(t('speechRate'), 'speechRate', 50, 200, 10, (v) => `${v}%`),
      this.createToggle(t('speechPace'), 'speechPace'),
      this.createRange(t('speechMaxSeconds'), 'speechMaxSeconds', 1, 15, 1, (v) => `${v} ${t('speechSeconds')}`),
      this.createHint(t('speechPaceHint')),
      this.createDivider(),
      this.createRange(t('speechBuffer'), 'speechBuffer', 1, 25, 1, (v) => String(v)),
      this.createHint(t('speechBufferHint')),
    );

    this.balloon.append(header, body);
    this.balloon.addEventListener('click', (e) => e.stopPropagation());
    this.balloon.addEventListener('pointerdown', (e) => e.stopPropagation());
    (getFullscreenElement() || document.body).appendChild(this.balloon);
    this.fillVoices();
  }

  createTest() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const label = document.createElement('span');
    label.className = 'ydm-balloon-label';
    label.textContent = t('speechTest');

    const controls = document.createElement('div');
    controls.className = 'ydm-speech-test';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-balloon-input';
    input.value = t('speechTestText');

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'ydm-speech-play';
    play.textContent = '▶';
    play.setAttribute('aria-label', t('speechPlay'));
    play.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      previewSpeech(input.value, false);
    });

    const fast = document.createElement('button');
    fast.type = 'button';
    fast.className = 'ydm-speech-play';
    fast.textContent = '▶▶';
    fast.setAttribute('aria-label', t('speechPlayFast'));
    fast.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      previewSpeech(input.value, true);
    });

    controls.append(input, play, fast);
    row.append(label, controls);
    return row;
  }

  createVoices() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const langLabel = document.createElement('span');
    langLabel.className = 'ydm-balloon-label';
    langLabel.textContent = t('speechVoiceLang');

    this.langSelect = document.createElement('select');
    this.langSelect.className = 'ydm-balloon-select';
    this.langSelect.addEventListener('change', () => {
      const lang = this.langSelect.value;
      this.updateSetting('speechLang', lang);
      const voices = this.voicesForLang(lang);
      const next = voices[0]?.voiceURI || '';
      this.updateSetting('speechVoice', next);
      this.fillVoices();
    });

    const voiceLabel = document.createElement('span');
    voiceLabel.className = 'ydm-balloon-label';
    voiceLabel.textContent = t('speechVoice');

    this.voiceSelect = document.createElement('select');
    this.voiceSelect.className = 'ydm-balloon-select';
    this.voiceSelect.addEventListener('change', () => {
      this.updateSetting('speechVoice', this.voiceSelect.value);
    });

    row.append(langLabel, this.langSelect, voiceLabel, this.voiceSelect);
    return row;
  }

  voicesForLang(lang) {
    const voices = listSpeechVoices();
    if (!lang) return voices;
    const wanted = lang.toLowerCase();
    return voices.filter((voice) => voice.lang.toLowerCase() === wanted);
  }

  fillVoices() {
    if (!this.langSelect || !this.voiceSelect) return;
    const voices = listSpeechVoices();
    const langs = [];
    for (const voice of voices) {
      if (voice.lang && !langs.includes(voice.lang)) langs.push(voice.lang);
    }
    langs.sort();

    const lang = this.settings.speechLang || '';
    this.langSelect.replaceChildren();
    this.langSelect.appendChild(new Option(t('speechVoiceDefault'), ''));
    for (const code of langs) {
      this.langSelect.appendChild(new Option(code, code));
    }
    this.langSelect.value = langs.includes(lang) ? lang : '';

    const visible = this.voicesForLang(this.langSelect.value);
    this.voiceSelect.replaceChildren();
    this.voiceSelect.appendChild(new Option(t('speechVoiceDefault'), ''));
    for (const voice of visible) {
      const option = new Option(`${voice.name} (${voice.lang})`, voice.voiceURI);
      this.voiceSelect.appendChild(option);
    }
    const selected = this.settings.speechVoice || '';
    this.voiceSelect.value = [...this.voiceSelect.options].some((option) => option.value === selected) ? selected : '';
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

  createSection(text) {
    const el = document.createElement('div');
    el.className = 'ydm-balloon-section';
    el.textContent = text;
    return el;
  }

  createHint(text) {
    const el = document.createElement('p');
    el.className = 'ydm-speech-note';
    el.textContent = text;
    return el;
  }

  createDivider() {
    const el = document.createElement('div');
    el.className = 'ydm-balloon-divider';
    return el;
  }
}

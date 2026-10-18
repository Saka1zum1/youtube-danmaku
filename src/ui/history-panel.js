class HistoryPanel {
  constructor({ onClose }) {
    this.onClose = onClose;
    this.balloon = null;
    this.anchor = null;
    this.isOpen = false;
    this.busy = false;
    this.abort = false;
    this.keywords = '';
    this.usernames = '';
    this.includeSuperchat = true;
    this.format = 'json';
    this.startSec = 0;
    this.endSec = 0;
    this.statusEl = null;
    this.downloadBtn = null;
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
    const duration = currentDurationSeconds();
    if (!this.endSec || this.endSec > duration) this.endSec = duration;
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
    this.abort = true;
    this.busy = false;
    this.isOpen = false;
    this.anchor = null;
    this.balloon?.remove();
    this.balloon = null;
    this.statusEl = null;
    this.downloadBtn = null;
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
    if (this.balloon.parentElement !== mountTarget) mountTarget.appendChild(this.balloon);
    const rect = this.anchor.getBoundingClientRect();
    const width = 340;
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

  setStatus(text, isError) {
    if (!this.statusEl) return;
    this.statusEl.textContent = text;
    this.statusEl.classList.toggle('ydm-history-status--error', !!isError);
  }

  render() {
    this.balloon = document.createElement('div');
    this.balloon.className = 'ydm-balloon ydm-history-panel';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';
    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('historyPanelTitle');
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
    const hint = document.createElement('p');
    hint.className = 'ydm-speech-note';
    hint.textContent = t('historyHint');

    body.append(
      hint,
      this.createField(t('historyKeywords'), t('historyKeywordsHint'), 'keywords'),
      this.createField(t('historyUsernames'), t('historyUsernamesHint'), 'usernames'),
      this.createSuperchatToggle(),
      this.createTimeRange(),
      this.createFormat(),
    );

    this.statusEl = document.createElement('p');
    this.statusEl.className = 'ydm-history-status';
    this.downloadBtn = document.createElement('button');
    this.downloadBtn.type = 'button';
    this.downloadBtn.className = 'ydm-history-download';
    this.downloadBtn.textContent = t('historyDownload');
    this.downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDownload();
    });
    body.append(this.statusEl, this.downloadBtn);

    this.balloon.append(header, body);
    this.balloon.addEventListener('click', (e) => e.stopPropagation());
    this.balloon.addEventListener('pointerdown', (e) => e.stopPropagation());
    (getFullscreenElement() || document.body).appendChild(this.balloon);
  }

  createField(label, placeholder, key) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-balloon-input';
    input.placeholder = placeholder;
    input.value = this[key];
    input.addEventListener('input', () => {
      this[key] = input.value;
    });
    row.append(labelEl, input);
    return row;
  }

  createSuperchatToggle() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--toggle';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = t('historySuperchat');
    const switchWrap = document.createElement('label');
    switchWrap.className = 'ydm-switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.includeSuperchat;
    const slider = document.createElement('span');
    slider.className = 'ydm-switch-slider';
    input.addEventListener('change', () => {
      this.includeSuperchat = input.checked;
    });
    switchWrap.append(input, slider);
    row.append(labelEl, switchWrap);
    return row;
  }

  createTimeRange() {
    const duration = currentDurationSeconds();
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = t('historyRange');
    row.appendChild(labelEl);
    if (!duration) {
      const note = document.createElement('p');
      note.className = 'ydm-speech-note';
      note.textContent = t('historyNoDuration');
      row.appendChild(note);
      return row;
    }
    if (!this.endSec) this.endSec = duration;
    const value = document.createElement('span');
    value.className = 'ydm-balloon-value';
    const updateLabel = () => {
      value.textContent = `${formatHistoryRangeLabel(this.startSec)} – ${formatHistoryRangeLabel(this.endSec)}`;
    };
    updateLabel();
    const header = document.createElement('div');
    header.className = 'ydm-balloon-field-header';
    header.append(labelEl, value);

    const start = this.createRangeInput(0, duration, this.startSec, (next) => {
      this.startSec = Math.min(next, this.endSec);
      start.value = String(this.startSec);
      updateLabel();
    });
    const end = this.createRangeInput(0, duration, this.endSec, (next) => {
      this.endSec = Math.max(next, this.startSec);
      end.value = String(this.endSec);
      updateLabel();
    });
    row.replaceChildren(header, start, end);
    return row;
  }

  createRangeInput(min, max, value, onInput) {
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'ydm-balloon-range';
    input.min = String(min);
    input.max = String(Math.max(min, Math.floor(max)));
    input.step = '1';
    input.value = String(Math.floor(value));
    input.addEventListener('input', () => onInput(Number(input.value)));
    return input;
  }

  createFormat() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = t('historyFormat');
    const select = document.createElement('select');
    select.className = 'ydm-balloon-select';
    for (const format of ['json', 'csv', 'txt']) {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = format.toUpperCase();
      if (format === this.format) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => {
      this.format = select.value;
    });
    row.append(labelEl, select);
    return row;
  }

  async startDownload() {
    if (this.busy) return;
    this.busy = true;
    this.abort = false;
    if (this.downloadBtn) this.downloadBtn.disabled = true;
    this.setStatus(t('historyDownloading'), false);
    const duration = currentDurationSeconds();
    const startMs = duration ? this.startSec * 1000 : 0;
    const endMs = duration ? this.endSec * 1000 : Infinity;
    try {
      const fetched = await fetchLiveChatHistory({
        startMs,
        endMs,
        shouldAbort: () => this.abort || !this.isOpen,
        onProgress: (count) => this.setStatus(`${t('historyProgress')} ${count}`, false),
      });
      if (this.abort || !this.isOpen) return;
      const filtered = filterLiveChatHistory(fetched, {
        keywords: this.keywords,
        usernames: this.usernames,
        includeSuperchat: this.includeSuperchat,
      });
      if (!filtered.length) {
        this.setStatus(fetched.length ? t('historyEmpty') : t('historyNone'), true);
        return;
      }
      downloadLiveChatFile(filtered, this.format, currentVideoId());
      this.setStatus(`${t('historyDone')} ${filtered.length}`, false);
    } catch (err) {
      if (this.abort || err?.code === 'aborted') return;
      this.setStatus(err?.code === 'no-history' ? t('historyNone') : t('historyFailed'), true);
    } finally {
      this.busy = false;
      if (this.downloadBtn) this.downloadBtn.disabled = false;
    }
  }
}

class LiveViewersBadge {
  constructor() {
    this.timer = null;
    this.mounting = false;
    this.wrapper = null;
    this.display = null;
    this.viewsWrap = null;
    this.countEl = null;
    this.lastVideoId = '';
    this.originalWrapperText = '';
    this.boundVisibility = () => {
      if (!document.hidden) this.refresh().catch(() => {});
    };
  }

  async start() {
    document.addEventListener('visibilitychange', this.boundVisibility);
    await this.mount();
    await this.refresh();
    this.clearTimer();
    this.timer = setInterval(() => {
      this.refresh().catch(() => {});
    }, VIEWERS_POLL_MS);
  }

  stop() {
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.clearTimer();
    this.teardownUi();
  }

  clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  remount() {
    if (this.viewsWrap?.isConnected && this.wrapper?.isConnected) return;
    this.teardownUi(false);
    this.mount().then(() => this.refresh()).catch(() => {});
  }

  async mount() {
    if (this.mounting) return;
    this.mounting = true;
    try {
      let display = document.querySelector('#movie_player .ytp-time-display.ytp-live');
      if (!display && isCurrentlyLive()) {
        display = await waitForElement('#movie_player .ytp-time-display.ytp-live', document, 8000);
      }
      if (!display?.isConnected) return;

      this.display = display;
      this.wrapper = display.querySelector('.ytp-time-wrapper:not(.ydm-live-views-wrapper)');
      if (!this.wrapper) return;

      if (!this.originalWrapperText) {
        this.originalWrapperText = this.wrapper.textContent?.trim() || 'Live';
      }

      let viewsWrap = display.querySelector('.ydm-live-views-wrapper');
      if (!viewsWrap) {
        viewsWrap = this.wrapper.cloneNode(false);
        viewsWrap.classList.add('ydm-live-views-wrapper');
        viewsWrap.removeAttribute('id');
        viewsWrap.setAttribute('aria-label', t('liveTotalViews'));
        viewsWrap.title = t('liveTotalViews');

        const iconWrap = document.createElement('span');
        iconWrap.className = 'ydm-live-views-icon';
        appendMarkup(iconWrap, ICON_EYE);

        const count = document.createElement('span');
        count.className = 'ydm-live-views-count';

        viewsWrap.append(iconWrap, count);
        this.wrapper.after(viewsWrap);
      }

      this.viewsWrap = viewsWrap;
      this.countEl = viewsWrap.querySelector('.ydm-live-views-count');
    } finally {
      this.mounting = false;
    }
  }

  teardownUi(restoreText = true) {
    if (restoreText && this.wrapper?.isConnected && this.originalWrapperText) {
      this.wrapper.textContent = this.originalWrapperText;
    }
    this.viewsWrap?.remove();
    this.viewsWrap = null;
    this.countEl = null;
    this.wrapper = null;
    this.display = null;
    this.originalWrapperText = '';
  }

  applyCounts({ live, concurrent, total }) {
    if (!live) {
      this.teardownUi(true);
      return;
    }

    if (!this.wrapper?.isConnected || !this.viewsWrap?.isConnected) {
      this.mount().then(() => {
        if (this.wrapper?.isConnected) this.applyCounts({ live, concurrent, total });
      }).catch(() => {});
      return;
    }

    this.wrapper.textContent = formatLiveConcurrentLabel(concurrent);
    this.wrapper.classList.add('ydm-live-time-wrapper');

    if (total == null) {
      this.viewsWrap.hidden = true;
      if (this.countEl) this.countEl.textContent = '';
      return;
    }

    this.viewsWrap.hidden = false;
    const formatted = formatCountNumber(total);
    if (this.countEl) this.countEl.textContent = formatted;
    this.viewsWrap.title = `${t('liveTotalViews')}: ${formatted}`;
    this.viewsWrap.setAttribute('aria-label', `${t('liveTotalViews')}: ${formatted}`);
  }

  async refresh() {
    if (!isWatchPage()) return;
    if (!isCurrentlyLive()) {
      this.applyCounts({ live: false, concurrent: null, total: null });
      return;
    }

    if (!this.wrapper?.isConnected || !this.viewsWrap?.isConnected) {
      await this.mount();
    }

    const videoId = liveVideoId();
    if (videoId && videoId !== this.lastVideoId) {
      this.lastVideoId = videoId;
      this.originalWrapperText = this.wrapper?.textContent?.trim() || 'Live';
    }

    const data = await fetchLiveViewers(videoId);
    this.applyCounts(data);
  }
}

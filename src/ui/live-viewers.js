class LiveViewersBadge {
  constructor() {
    this.timer = null;
    this.mounting = false;
    this.display = null;
    this.concurrentWrap = null;
    this.concurrentEl = null;
    this.viewsWrap = null;
    this.countEl = null;
    this.lastVideoId = '';
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
    if (this.concurrentWrap?.isConnected && this.viewsWrap?.isConnected) return;
    this.teardownUi(false);
    this.mount().then(() => this.refresh()).catch(() => {});
  }

  insertAfterNativeTime(display, node) {
    const nativeWrap = display.querySelector(
      '.ytp-time-wrapper:not(.ydm-live-views-wrapper):not(.ydm-live-concurrent-wrapper)',
    );
    const liveBadge = display.querySelector('.ytp-live-badge');
    const anchor = nativeWrap || liveBadge;
    if (anchor?.parentElement === display) anchor.after(node);
    else display.appendChild(node);
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

      let concurrentWrap = display.querySelector('.ydm-live-concurrent-wrapper');
      if (!concurrentWrap) {
        concurrentWrap = document.createElement('span');
        concurrentWrap.className = 'ytp-time-wrapper ydm-live-concurrent-wrapper';
        concurrentWrap.setAttribute('aria-hidden', 'true');

        const count = document.createElement('span');
        count.className = 'ydm-live-concurrent-count';
        concurrentWrap.appendChild(count);
        this.insertAfterNativeTime(display, concurrentWrap);
      }
      this.concurrentWrap = concurrentWrap;
      this.concurrentEl = concurrentWrap.querySelector('.ydm-live-concurrent-count');

      let viewsWrap = display.querySelector('.ydm-live-views-wrapper');
      if (!viewsWrap) {
        viewsWrap = document.createElement('span');
        viewsWrap.className = 'ytp-time-wrapper ydm-live-views-wrapper';
        viewsWrap.removeAttribute('id');
        viewsWrap.setAttribute('aria-label', t('liveTotalViews'));
        viewsWrap.title = t('liveTotalViews');

        const iconWrap = document.createElement('span');
        iconWrap.className = 'ydm-live-views-icon';
        appendMarkup(iconWrap, ICON_EYE);

        const count = document.createElement('span');
        count.className = 'ydm-live-views-count';

        viewsWrap.append(iconWrap, count);
        if (concurrentWrap.isConnected) concurrentWrap.after(viewsWrap);
        else this.insertAfterNativeTime(display, viewsWrap);
      }

      this.viewsWrap = viewsWrap;
      this.countEl = viewsWrap.querySelector('.ydm-live-views-count');
    } finally {
      this.mounting = false;
    }
  }

  teardownUi() {
    this.concurrentWrap?.remove();
    this.viewsWrap?.remove();
    this.concurrentWrap = null;
    this.concurrentEl = null;
    this.viewsWrap = null;
    this.countEl = null;
    this.display = null;
  }

  applyCounts({ live, concurrent, total }) {
    if (!live) {
      this.teardownUi();
      return;
    }

    if (!this.concurrentWrap?.isConnected || !this.viewsWrap?.isConnected) {
      this.mount().then(() => {
        if (this.concurrentWrap?.isConnected) this.applyCounts({ live, concurrent, total });
      }).catch(() => {});
      return;
    }

    const concurrentText = formatLiveConcurrentSuffix(concurrent);
    if (this.concurrentEl) this.concurrentEl.textContent = concurrentText;
    if (this.concurrentWrap) {
      this.concurrentWrap.hidden = !concurrentText;
      this.concurrentWrap.title = concurrentText
        ? `${formatCountNumber(concurrent)} ${t('liveWatching')}`
        : '';
    }

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

    if (!this.concurrentWrap?.isConnected || !this.viewsWrap?.isConnected) {
      await this.mount();
    }

    const videoId = liveVideoId();
    if (videoId) this.lastVideoId = videoId;

    const data = await fetchLiveViewers(videoId);
    this.applyCounts(data);
  }
}
let settings = loadSettings();
let danmaku = null;
let danmakuEmitter = null;
let translateQueue = null;
let chatObserver = null;
let settingsPanel = null;
let speechPanel = null;
let historyPanel = null;
let controlButton = null;
let stylesInjected = false;
let pageActive = isPageActive();
let generation = 0;
let navKey = null;
let reconciling = false;

function getSettings() {
  return settings;
}

function isActive() {
  if (!isWatchPage()) return false;
  if (document.documentElement.dataset.ydmPreview === 'true') return true;
  return pageActive;
}

function onSettingsChange(newSettings) {
  settings = newSettings;
  danmaku?.updateLayout();
  controlButton?.updateDanmakuState();
  controlButton?.updateSpeechState();
  if (!settings.translateEnabled) translateQueue?.clear();
}

function toggleDanmaku() {
  settings.enabled = !settings.enabled;
  saveSettings(settings);
  onSettingsChange(settings);
}

function handleVisibilityChange() {
  const wasActive = pageActive;
  pageActive = isPageActive();
  if (wasActive && !pageActive) {
    danmakuEmitter?.clear();
    translateQueue?.clear();
    cancelSpeech();
  }
}

function teardown() {
  generation += 1;
  chatObserver?.stop();
  danmaku?.destroy();
  controlButton?.destroy();
  danmakuEmitter?.clear();
  translateQueue?.clear();
  settingsPanel?.close();
  speechPanel?.close();
  historyPanel?.close();
  cancelSpeech();
  chatObserver = null;
  danmaku = null;
  danmakuEmitter = null;
  translateQueue = null;
  controlButton = null;
}

async function boot() {
  if (!isWatchPage()) return;
  const gen = ++generation;
  settings = loadSettings();
  pageActive = isPageActive();

  if (!stylesInjected) {
    injectStyles();
    stylesInjected = true;
  }

  ensureSpeechSpeaker(getSettings);

  const engine = new DanmakuEngine(getSettings);
  const emitter = new DanmakuEmitter(engine, getSettings, isActive);
  const queue = new TranslateQueue(getSettings, isActive);
  const observer = new ChatObserver({
    getSettings,
    danmakuEmitter: emitter,
    translateQueue: queue,
    isActive,
  });

  if (!settingsPanel) {
    settingsPanel = new SettingsPanel({
      settings,
      onChange: onSettingsChange,
      onClose: () => controlButton?.updatePanelState(),
    });
  } else {
    settingsPanel.settings = settings;
  }

  if (!speechPanel) {
    speechPanel = new SpeechPanel({
      settings,
      onChange: onSettingsChange,
      onClose: () => controlButton?.updateSpeechState(),
    });
  } else {
    speechPanel.settings = settings;
  }

  if (!historyPanel) {
    historyPanel = new HistoryPanel({
      onClose: () => controlButton?.updateHistoryState(),
    });
  }

  const controls = new ControlButton({
    onToggleDanmaku: toggleDanmaku,
    onTogglePanel: (anchor) => {
      speechPanel.close();
      historyPanel.close();
      settingsPanel.toggle(anchor);
      controls.updatePanelState();
    },
    onToggleSpeech: (anchor) => {
      settingsPanel.close();
      historyPanel.close();
      speechPanel.toggle(anchor);
      controls.updatePanelState();
    },
    onToggleHistory: (anchor) => {
      settingsPanel.close();
      speechPanel.close();
      historyPanel.toggle(anchor);
      controls.updatePanelState();
    },
    getSettings,
    isPanelOpen: () => settingsPanel.isOpen,
    isSpeechPanelOpen: () => speechPanel.isOpen,
    isHistoryPanelOpen: () => historyPanel.isOpen,
  });

  await engine.mount();
  if (gen !== generation) {
    engine.destroy();
    return;
  }

  danmaku = engine;
  danmakuEmitter = emitter;
  translateQueue = queue;
  chatObserver = observer;
  controlButton = controls;

  await observer.start();
  if (gen !== generation) return;
  await controls.mount();
  if (gen !== generation) return;

  console.log('[YDM] YouTube Danmaku initialized');
}

async function reconcile() {
  if (reconciling) return;
  const key = pageKey();
  if (key === navKey) {
    if (!key) return;
    controlButton?.remount();
    if (chatObserver && !chatObserver.isConnected()) {
      chatObserver.start().catch((err) => console.warn('[YDM] Chat restart failed:', err));
    }
    return;
  }

  reconciling = true;
  navKey = key;
  try {
    teardown();
    if (key) await boot();
  } catch (err) {
    console.error('[YDM] Reinit failed:', err);
    navKey = null;
  } finally {
    reconciling = false;
  }
}

function watchNavigation() {
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
      reconcile().catch((err) => console.error('[YDM] Reinit failed:', err));
    }, 50);
  });
  setInterval(() => {
    reconcile().catch((err) => console.error('[YDM] Reinit failed:', err));
  }, 1500);
}

document.addEventListener('visibilitychange', handleVisibilityChange);

navKey = pageKey();
if (navKey) {
  boot().catch((err) => {
    console.error('[YDM] Init failed:', err);
    navKey = null;
  });
}

watchNavigation();

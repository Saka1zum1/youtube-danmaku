let settings = loadSettings();
let danmaku = null;
let danmakuEmitter = null;
let translateQueue = null;
let chatObserver = null;
let favoritesPanel = null;
let fullscreenChat = null;
let chatClearButton = null;
let settingsPanel = null;
let speechPanel = null;
let historyPanel = null;
let controlButton = null;
let liveViewersBadge = null;
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
  if (!settings.translateEnabled) {
    translateQueue?.clear();
    clearAllChatTranslations();
  } else if (!settings.translateInChat) {
    clearAllChatTranslations();
  }
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

function cleanupLegacyChatCollapseUi() {
  document.documentElement.classList.remove('ydm-chat-collapsed');
  document.querySelectorAll(
    '[data-ydm-chat-collapse="true"], [data-ydm-chat-collapse-wrap="true"], [data-ydm-chat-expand="true"]',
  ).forEach((el) => el.remove());
  document.querySelector('ytd-live-chat-frame[data-ydm-collapsed]')?.removeAttribute('data-ydm-collapsed');
}

function teardown() {
  generation += 1;
  chatObserver?.stop();
  favoritesPanel?.destroy();
  fullscreenChat?.destroy();
  chatClearButton?.destroy();
  cleanupLegacyChatCollapseUi();
  danmaku?.destroy();
  controlButton?.destroy();
  danmakuEmitter?.clear();
  translateQueue?.clear();
  settingsPanel?.close();
  speechPanel?.close();
  historyPanel?.close();
  liveViewersBadge?.stop();
  cancelSpeech();
  chatObserver = null;
  favoritesPanel = null;
  fullscreenChat = null;
  chatClearButton = null;
  danmaku = null;
  danmakuEmitter = null;
  translateQueue = null;
  controlButton = null;
  liveViewersBadge = null;
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
  favoritesPanel = new FavoritesPanel();
  favoritesPanel.attach();

  fullscreenChat = new FullscreenChatInput({ favoritesPanel });
  fullscreenChat.attach();

  chatClearButton = new ChatClearButton({
    onClear: () => {
      chatObserver?.seenIds?.clear?.();
    },
  });
  const observer = new ChatObserver({
    getSettings,
    danmakuEmitter: emitter,
    translateQueue: queue,
    isActive,
    favoritesPanel,
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
  liveViewersBadge = new LiveViewersBadge();

  await observer.start();
  if (gen !== generation) return;
  await controls.mount();
  if (gen !== generation) return;
  await liveViewersBadge.start();
  if (gen !== generation) return;
  await favoritesPanel.mount();
  if (gen !== generation) return;
  await chatClearButton.mount();
  if (gen !== generation) return;
  cleanupLegacyChatCollapseUi();
  if (gen !== generation) return;

  console.log('[YDM] YouTube Danmaku initialized');
}

async function reconcile() {
  if (reconciling) return;
  const key = pageKey();
  if (key === navKey) {
    if (!key) return;
    controlButton?.remount();
    liveViewersBadge?.remount();
    favoritesPanel?.remount();
    chatClearButton?.remount();
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

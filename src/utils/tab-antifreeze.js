const TabAntiFreeze = {
  active: false,
  records: [],
  timer: null,
};

function tabAntiFreezeStopEvent(event) {
  // Synthetic events are how we tell the page it is visible again.
  // Only the browser's real hide/show events should be swallowed.
  if (!event.isTrusted) return;
  event.stopImmediatePropagation();
}

function tabAntiFreezeDefine(doc, key, getter) {
  const own = Object.getOwnPropertyDescriptor(doc, key) || null;
  Object.defineProperty(doc, key, {
    configurable: true,
    enumerable: true,
    get: getter,
  });
  return own;
}

function tabAntiFreezePatchDocument(doc) {
  if (!doc || TabAntiFreeze.records.some((record) => record.doc === doc)) return;
  const saved = {};
  try {
    saved.hidden = tabAntiFreezeDefine(doc, 'hidden', () => false);
    saved.visibilityState = tabAntiFreezeDefine(doc, 'visibilityState', () => 'visible');
    if ('webkitHidden' in doc) {
      saved.webkitHidden = tabAntiFreezeDefine(doc, 'webkitHidden', () => false);
    }
    if ('webkitVisibilityState' in doc) {
      saved.webkitVisibilityState = tabAntiFreezeDefine(doc, 'webkitVisibilityState', () => 'visible');
    }
  } catch (error) {
    console.warn('[YDM] Tab anti-freeze: could not patch visibility', error);
    return;
  }

  const win = doc.defaultView;
  const savedFocus = typeof win?.hasFocus === 'function' ? win.hasFocus : null;
  if (win && savedFocus) {
    try { win.hasFocus = () => true; } catch (_) { /* ignore */ }
  }

  const handler = tabAntiFreezeStopEvent;
  doc.addEventListener('visibilitychange', handler, true);
  doc.addEventListener('webkitvisibilitychange', handler, true);
  win?.addEventListener('visibilitychange', handler, true);
  win?.addEventListener('webkitvisibilitychange', handler, true);

  TabAntiFreeze.records.push({ doc, saved, win, savedFocus, handler });
  try { doc.dispatchEvent(new Event('visibilitychange')); } catch (_) { /* ignore */ }
}

function tabAntiFreezeChatDocument() {
  const iframe = document.querySelector(SELECTORS.chatFrame);
  if (!iframe) return null;
  try {
    return iframe.contentDocument || null;
  } catch (_) {
    return null;
  }
}

function tabAntiFreezeCollect() {
  const docs = [];
  try {
    const pageDoc = (typeof unsafeWindow !== 'undefined' && unsafeWindow.document) || document;
    if (pageDoc) docs.push(pageDoc);
  } catch (_) { /* sandbox may hide unsafeWindow */ }
  if (document && !docs.includes(document)) docs.push(document);
  const chatDoc = tabAntiFreezeChatDocument();
  if (chatDoc && !docs.includes(chatDoc)) docs.push(chatDoc);
  return docs;
}

function tabAntiFreezeEnable() {
  TabAntiFreeze.active = true;
  for (const doc of tabAntiFreezeCollect()) tabAntiFreezePatchDocument(doc);
  if (!TabAntiFreeze.timer) {
    TabAntiFreeze.timer = setInterval(() => {
      if (!TabAntiFreeze.active) return;
      for (const doc of tabAntiFreezeCollect()) tabAntiFreezePatchDocument(doc);
    }, 1000);
  }
}

function tabAntiFreezeRestore(record) {
  const { doc, saved, win, savedFocus, handler } = record;
  try {
    doc.removeEventListener('visibilitychange', handler, true);
    doc.removeEventListener('webkitvisibilitychange', handler, true);
  } catch (_) { /* detached document */ }
  try {
    win?.removeEventListener('visibilitychange', handler, true);
    win?.removeEventListener('webkitvisibilitychange', handler, true);
  } catch (_) { /* detached window */ }
  if (win && savedFocus) {
    try { win.hasFocus = savedFocus; } catch (_) { /* ignore */ }
  }
  for (const key of Object.keys(saved)) {
    try {
      if (saved[key]) Object.defineProperty(doc, key, saved[key]);
      else delete doc[key];
    } catch (_) {
      try { delete doc[key]; } catch (_) { /* ignore */ }
    }
  }
  try { doc.dispatchEvent(new Event('visibilitychange')); } catch (_) { /* detached */ }
}

function tabAntiFreezeDisable() {
  if (!TabAntiFreeze.active && !TabAntiFreeze.records.length) return;
  clearInterval(TabAntiFreeze.timer);
  TabAntiFreeze.timer = null;
  const records = TabAntiFreeze.records.splice(0);
  for (const record of records) tabAntiFreezeRestore(record);
  TabAntiFreeze.active = false;
}

function tabAntiFreezeIsEnabled() {
  return TabAntiFreeze.active;
}

function syncTabAntiFreeze(isPipOpen) {
  if (isPipOpen?.()) tabAntiFreezeEnable();
  else tabAntiFreezeDisable();
}

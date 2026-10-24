const CHAT_TRANSLATE_STYLE_ID = 'ydm-chat-translate-style';

const CHAT_TRANSLATE_CSS = `
.ydm-chat-translation {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  margin: 3px 0 1px;
  padding: 3px 0 2px 8px;
  border-left: 2px solid rgba(230, 33, 23, 1);
  background: rgba(155, 155, 155, 0.4);
  color: #fff;
  font-size: 12.5px;
  line-height: 1.4;
  font-weight: 400;
  font-style: italic;
  white-space: normal;
  word-break: break-word;
}

.ydm-chat-translation-label {
  flex: 0 0 auto;
  margin-top: 1px;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(230, 33, 23, 1);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  font-style: normal;
  letter-spacing: 0.02em;
  line-height: 1.5;
  text-transform: uppercase;
}

.ydm-chat-translation-text {
  flex: 1 1 auto;
  min-width: 0;
  color: #0f0f0f;
}

.ydm-chat-translation--pending .ydm-chat-translation-text {
  color: #606060;
  font-style: italic;
}

.ydm-chat-translation--error .ydm-chat-translation-text {
  color: #b71c1c;
}

.ydm-chat-menu {
  position: fixed;
  z-index: 2147483646;
  min-width: 160px;
  padding: 6px 0;
  border-radius: 8px;
  background: #212121;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
  color: #fff;
  font-family: Roboto, Arial, sans-serif;
  font-size: 13px;
}

.ydm-chat-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.ydm-chat-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ydm-chat-menu-item svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  flex: 0 0 auto;
}

.ydm-sc-action-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  margin: 6px 0 2px;
  padding: 6px;
  border-radius: 8px;
  background: rgba(15, 15, 15, 0.72);
}

.ydm-sc-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
}

.ydm-sc-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ydm-sc-action-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.ydm-sc-action-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex: 0 0 auto;
}
`;

function ensureChatTranslateStyles(doc) {
  if (!doc || doc.getElementById(CHAT_TRANSLATE_STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = CHAT_TRANSLATE_STYLE_ID;
  style.textContent = CHAT_TRANSLATE_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

function findChatTranslationMount(msgEl) {
  const messageContainer = msgEl.querySelector('#message-container');
  if (messageContainer) return { parent: messageContainer.parentElement, after: messageContainer };

  const message = msgEl.querySelector('#message');
  if (message) return { parent: message.parentElement, after: message };

  const content = msgEl.querySelector('#content');
  if (content) return { parent: content, after: null };

  return { parent: msgEl, after: null };
}

function removeChatTranslation(msgEl) {
  if (!msgEl) return;
  msgEl.querySelectorAll('.ydm-chat-translation').forEach((node) => node.remove());
}

function clearAllChatTranslations() {
  const doc = getChatDocument();
  if (!doc) return;
  doc.querySelectorAll('.ydm-chat-translation').forEach((node) => node.remove());
}

function getChatTranslationText(msgEl) {
  return msgEl?.querySelector('.ydm-chat-translation-text')?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function hasChatTranslation(msgEl) {
  const el = msgEl?.querySelector?.('.ydm-chat-translation');
  if (!el) return false;
  if (el.classList.contains('ydm-chat-translation--pending')) return false;
  if (el.classList.contains('ydm-chat-translation--error')) return false;
  return !!getChatTranslationText(msgEl);
}

function hasChatTranslationError(msgEl) {
  return !!msgEl?.querySelector?.('.ydm-chat-translation--error');
}

function ensureChatTranslationEl(msgEl) {
  const doc = msgEl.ownerDocument;
  ensureChatTranslateStyles(doc);
  let el = msgEl.querySelector('.ydm-chat-translation');
  if (el) return el;

  el = doc.createElement('div');
  el.className = 'ydm-chat-translation';
  el.setAttribute('dir', 'auto');

  const label = doc.createElement('span');
  label.className = 'ydm-chat-translation-label';
  label.textContent = t('translateInChatBadge');

  const text = doc.createElement('span');
  text.className = 'ydm-chat-translation-text';

  el.append(label, text);

  const mount = findChatTranslationMount(msgEl);
  if (!mount.parent) return null;
  if (mount.after?.parentElement === mount.parent) mount.after.after(el);
  else mount.parent.appendChild(el);
  return el;
}

function applyChatTranslation(msgEl, translatedText, originalText) {
  if (!msgEl?.isConnected) return;

  const translated = String(translatedText || '').replace(/\s+/g, ' ').trim();
  const original = String(originalText || '').replace(/\s+/g, ' ').trim();
  if (!translated || translated === original) {
    removeChatTranslation(msgEl);
    return;
  }

  const el = ensureChatTranslationEl(msgEl);
  if (!el) return;
  el.classList.remove('ydm-chat-translation--pending', 'ydm-chat-translation--error');
  const textEl = el.querySelector('.ydm-chat-translation-text');
  if (textEl) textEl.textContent = translated;
}

function setChatTranslationStatus(msgEl, status, text) {
  if (!msgEl?.isConnected) return;
  const el = ensureChatTranslationEl(msgEl);
  if (!el) return;
  el.classList.toggle('ydm-chat-translation--pending', status === 'pending');
  el.classList.toggle('ydm-chat-translation--error', status === 'error');
  const textEl = el.querySelector('.ydm-chat-translation-text');
  if (textEl) textEl.textContent = text || '';
}

function closeChatOverlayUi(doc) {
  if (!doc) return;
  doc.querySelectorAll('.ydm-chat-menu, .ydm-sc-action-panel').forEach((node) => node.remove());
}

function createChatActionButton(doc, { icon, label, onClick }) {
  const btn = doc.createElement('button');
  btn.type = 'button';
  const iconWrap = doc.createElement('span');
  appendMarkup(iconWrap, icon);
  const text = doc.createElement('span');
  text.textContent = label;
  btn.append(iconWrap, text);
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
  });
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  return btn;
}

function showChatContextMenu(doc, clientX, clientY, items) {
  closeChatOverlayUi(doc);
  ensureChatTranslateStyles(doc);

  const menu = doc.createElement('div');
  menu.className = 'ydm-chat-menu';
  menu.addEventListener('click', (e) => e.stopPropagation());
  menu.addEventListener('contextmenu', (e) => e.preventDefault());

  for (const item of items) {
    const btn = createChatActionButton(doc, item);
    btn.className = 'ydm-chat-menu-item';
    menu.appendChild(btn);
  }

  (doc.body || doc.documentElement).appendChild(menu);

  const width = menu.offsetWidth || 160;
  const height = menu.offsetHeight || 40;
  const viewW = doc.defaultView?.innerWidth || width;
  const viewH = doc.defaultView?.innerHeight || height;
  const left = Math.max(8, Math.min(clientX, viewW - width - 8));
  const top = Math.max(8, Math.min(clientY, viewH - height - 8));
  Object.assign(menu.style, { left: `${left}px`, top: `${top}px` });
  return menu;
}

function showSuperchatActionPanel(msgEl, items) {
  const doc = msgEl.ownerDocument;
  ensureChatTranslateStyles(doc);

  msgEl.querySelectorAll('.ydm-sc-action-panel').forEach((node) => node.remove());

  const panel = doc.createElement('div');
  panel.className = 'ydm-sc-action-panel';
  panel.addEventListener('click', (e) => e.stopPropagation());

  for (const item of items) {
    const btn = createChatActionButton(doc, item);
    btn.className = 'ydm-sc-action-btn';
    panel.appendChild(btn);
  }

  const mount = findChatTranslationMount(msgEl);
  const translation = msgEl.querySelector('.ydm-chat-translation');
  if (translation) translation.after(panel);
  else if (mount.after?.parentElement === mount.parent) mount.after.after(panel);
  else if (mount.parent) mount.parent.appendChild(panel);
  else msgEl.appendChild(panel);

  return panel;
}

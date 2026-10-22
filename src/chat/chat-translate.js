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
  border-left: 2px solid #3ea6ff;
  color: #9ecbff;
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
  background: rgba(62, 166, 255, 0.18);
  color: #3ea6ff;
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
  color: #9ecbff;
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

function applyChatTranslation(msgEl, translatedText, originalText) {
  if (!msgEl?.isConnected) return;

  const translated = String(translatedText || '').replace(/\s+/g, ' ').trim();
  const original = String(originalText || '').replace(/\s+/g, ' ').trim();
  if (!translated || translated === original) {
    removeChatTranslation(msgEl);
    return;
  }

  const doc = msgEl.ownerDocument;
  ensureChatTranslateStyles(doc);

  let el = msgEl.querySelector('.ydm-chat-translation');
  if (!el) {
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
    if (!mount.parent) return;
    if (mount.after?.parentElement === mount.parent) mount.after.after(el);
    else mount.parent.appendChild(el);
  }

  const textEl = el.querySelector('.ydm-chat-translation-text');
  if (textEl) textEl.textContent = translated;
}

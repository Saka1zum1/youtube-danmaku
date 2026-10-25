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

  // Paid stickers / message-less SC: `#content` is a tight horizontal flex —
  // mounting the panel inside squeezes the author name out of view.
  const isPaidSticker = msgEl.tagName === 'YT-LIVE-CHAT-PAID-STICKER-RENDERER';
  const purchaseDesc = msgEl.querySelector('#purchase-description');
  const hasBodyText = !!(
    msgEl.querySelector('#message')?.textContent?.trim()
    || (purchaseDesc && !purchaseDesc.hasAttribute('hidden') && purchaseDesc.textContent?.trim())
  );
  const card = msgEl.querySelector('#card');

  if ((isPaidSticker || !hasBodyText) && card?.parentElement) {
    card.after(panel);
    return panel;
  }

  const mount = findChatTranslationMount(msgEl);
  const translation = msgEl.querySelector('.ydm-chat-translation');
  if (translation) translation.after(panel);
  else if (mount.after?.parentElement === mount.parent) mount.after.after(panel);
  else if (mount.parent) mount.parent.appendChild(panel);
  else msgEl.appendChild(panel);

  return panel;
}

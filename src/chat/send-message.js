const SEND_PARAMS_CACHE = { key: '', params: '', at: 0 };

/** Matches kusaanko/YouTubeLiveChat Util.generateClientMessageId() — 26 chars from [a-zA-Z-]. */
const CLIENT_MESSAGE_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-';
const CLIENT_MESSAGE_ID_STATE = { base: '', counter: 0 };

function generateClientMessageIdBase() {
  let out = '';
  const alphabet = CLIENT_MESSAGE_ID_ALPHABET;
  const len = alphabet.length;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint8Array(26);
    crypto.getRandomValues(buf);
    for (let i = 0; i < 26; i += 1) out += alphabet[buf[i] % len];
    return out;
  }
  for (let i = 0; i < 26; i += 1) {
    out += alphabet[Math.floor(Math.random() * len)];
  }
  return out;
}

/**
 * clientMessageId = base(26) + counter, same as YouTubeLiveChat.getPayloadToSendMessage.
 * @see https://github.com/kusaanko/YouTubeLiveChat
 */
function createClientMessageId() {
  if (!CLIENT_MESSAGE_ID_STATE.base) {
    CLIENT_MESSAGE_ID_STATE.base = generateClientMessageIdBase();
    CLIENT_MESSAGE_ID_STATE.counter = 0;
  }
  if (CLIENT_MESSAGE_ID_STATE.counter >= Number.MAX_SAFE_INTEGER - 1) {
    CLIENT_MESSAGE_ID_STATE.counter = 0;
  }
  return CLIENT_MESSAGE_ID_STATE.base + CLIENT_MESSAGE_ID_STATE.counter++;
}

function walkFindSendParams(node, depth = 0, seen = new Set()) {
  if (!node || depth > 14) return '';
  if (typeof node !== 'object') return '';
  if (seen.has(node)) return '';
  seen.add(node);

  try {
    const endpoint = node.sendLiveChatMessageEndpoint || node.sendLiveChatMessageCommand;
    if (endpoint?.params) return String(endpoint.params);
    if (node.commandMetadata?.webCommandMetadata?.apiUrl?.includes?.('send_message') && node.params) {
      return String(node.params);
    }
  } catch (_) {
    /* ignore */
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkFindSendParams(item, depth + 1, seen);
      if (found) return found;
    }
    return '';
  }

  for (const value of Object.values(node)) {
    const found = walkFindSendParams(value, depth + 1, seen);
    if (found) return found;
  }
  return '';
}

function readSendParamsFromSources() {
  const page = pageWin();
  const chatDoc = getChatDocument();
  const chatWin = chatDoc?.defaultView;
  const sources = [
    chatWin?.ytInitialData,
    chatWin?.ytcfg?.data_,
    page.ytInitialData,
    page.ytcfg?.data_,
  ];
  for (const source of sources) {
    const found = walkFindSendParams(source);
    if (found) return found;
  }
  return '';
}

function getLiveChatSendParams(force = false) {
  const key = pageKey() || location.href;
  if (!force && SEND_PARAMS_CACHE.params && SEND_PARAMS_CACHE.key === key && Date.now() - SEND_PARAMS_CACHE.at < 120000) {
    return SEND_PARAMS_CACHE.params;
  }
  const params = readSendParamsFromSources();
  if (params) {
    SEND_PARAMS_CACHE.key = key;
    SEND_PARAMS_CACHE.params = params;
    SEND_PARAMS_CACHE.at = Date.now();
  }
  return params;
}

function readCookieValue(name) {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch (_) {
    return '';
  }
}

async function sha1Hex(text) {
  const data = new TextEncoder().encode(text);
  if (crypto?.subtle?.digest) {
    const buf = await crypto.subtle.digest('SHA-1', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

/** SAPISIDHASH Authorization as in kusaanko/YouTubeLiveChat.getHeader(). */
async function buildSapisidAuthorization() {
  const sapisid = readCookieValue('SAPISID')
    || readCookieValue('__Secure-3PAPISID')
    || readCookieValue('__Secure-1PAPISID');
  if (!sapisid) return '';
  const time = Math.floor(Date.now() / 1000);
  const origin = 'https://www.youtube.com';
  const digest = await sha1Hex(`${time} ${sapisid} ${origin}`);
  if (!digest) return '';
  return `SAPISIDHASH ${time}_${digest}`;
}

function readDatasyncId(win) {
  try {
    const raw = win?.ytcfg?.get?.('DATASYNC_ID')
      || win?.ytcfg?.data_?.DATASYNC_ID
      || '';
    return String(raw).split('||')[0] || '';
  } catch (_) {
    return '';
  }
}

function getInnertubeSendConfig() {
  const page = pageWin();
  const chatWin = getChatDocument()?.defaultView;
  const windows = [chatWin, page].filter(Boolean);
  for (const win of windows) {
    const ytcfg = win.ytcfg;
    if (!ytcfg?.get) continue;
    let key = '';
    let context = null;
    try {
      key = ytcfg.get('INNERTUBE_API_KEY') || '';
      context = ytcfg.get('INNERTUBE_CONTEXT') || null;
    } catch (_) {
      continue;
    }
    if (!key || !context) continue;
    return {
      win,
      key,
      context,
      clientName: String(ytcfg.get('INNERTUBE_CONTEXT_CLIENT_NAME') || context?.client?.clientName || '1'),
      clientVersion: String(
        context?.client?.clientVersion || ytcfg.get('INNERTUBE_CLIENT_VERSION') || '',
      ),
      datasyncId: readDatasyncId(win) || readDatasyncId(page),
      fetchFn: typeof win.fetch === 'function' ? win.fetch.bind(win) : page.fetch?.bind(page),
    };
  }
  return null;
}

function buildSendContext(baseContext, datasyncId) {
  let context;
  try {
    context = JSON.parse(JSON.stringify(baseContext || {}));
  } catch (_) {
    context = { client: { clientName: 'WEB' } };
  }
  if (!context.client || typeof context.client !== 'object') context.client = {};
  if (!context.client.clientName) context.client.clientName = 'WEB';
  if (!context.user || typeof context.user !== 'object') context.user = {};
  if (datasyncId) context.user.onBehalfOfUser = datasyncId;
  if (typeof context.user.lockedSafetyMode !== 'boolean') context.user.lockedSafetyMode = false;
  return context;
}

function normalizeYouTubeSendCode(raw) {
  const code = String(raw || '').trim().toLowerCase();
  if (!code) return '';
  if (code.includes('login') || code.includes('auth') || code.includes('unauthenticated')) return 'not_logged_in';
  if (code.includes('slow')) return 'slow_mode';
  if (code.includes('duplicate')) return 'duplicate';
  if (code.includes('rate') || code.includes('too_many')) return 'rate_limit';
  if (code.includes('forbidden') || code.includes('permission')) return 'forbidden';
  if (code.includes('live_chat_disabled') || code.includes('chat_disabled')) return 'chat_disabled';
  if (code.includes('empty')) return 'empty_message';
  return code || 'send_failed';
}

function chatSendErrorMessage(error) {
  const code = normalizeYouTubeSendCode(error?.code || error?.message);
  switch (code) {
    case 'not_logged_in':
      return t('fsChatNeedLogin');
    case 'no_channel':
    case 'no_params':
      return t('favoritesNeedChannel');
    case 'slow_mode':
      return t('fsChatSlowMode');
    case 'duplicate':
      return t('fsChatDuplicate');
    case 'rate_limit':
      return t('fsChatRateLimit');
    case 'forbidden':
      return t('fsChatForbidden');
    case 'chat_disabled':
      return t('fsChatDisabled');
    case 'empty_message':
      return t('favoritesEmptyText');
    case 'preview':
      return t('fsChatPreviewOnly');
    default:
      break;
  }
  const msg = String(error?.userMessage || '').trim();
  return msg || t('fsChatFailed');
}

function createSendError(code, userMessage = '', details = null) {
  const error = new Error(code || 'send_failed');
  error.code = code || 'send_failed';
  error.userMessage = userMessage || '';
  error.details = details;
  return error;
}

async function sendViaDomFallback(text) {
  const ok = await setChatInputText(text);
  if (!ok) throw createSendError('send_failed');
  const doc = getChatDocument();
  const btn = doc?.querySelector(
    '#send-button button:not([disabled]), yt-button-renderer#send-button button:not([disabled]), #send-button',
  );
  if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
    throw createSendError('send_failed', t('fsChatFailed'));
  }
  btn.click();
  return { via: 'dom' };
}

async function sendYouTubeLiveChatMessage(message) {
  const text = String(message || '').trim();
  if (!text) throw createSendError('empty_message');

  if (document.documentElement.dataset.ydmPreview === 'true') {
    throw createSendError('preview');
  }

  const config = getInnertubeSendConfig();
  const params = getLiveChatSendParams(true);

  if (config?.key && config.context && params && config.fetchFn) {
    try {
      const context = buildSendContext(config.context, config.datasyncId);
      const authorization = await buildSapisidAuthorization();
      const headers = {
        'Content-Type': 'application/json',
        'X-Youtube-Client-Name': config.clientName,
        'X-Youtube-Client-Version': config.clientVersion,
        Origin: 'https://www.youtube.com',
        'X-Origin': 'https://www.youtube.com',
      };
      if (authorization) headers.Authorization = authorization;

      const response = await config.fetchFn(
        `https://www.youtube.com/youtubei/v1/live_chat/send_message?prettyPrint=false&key=${encodeURIComponent(config.key)}`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify({
            context,
            params,
            clientMessageId: createClientMessageId(),
            richMessage: {
              textSegments: [{ text }],
            },
          }),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const apiCode = data?.error?.status || data?.error?.message || `http_${response.status}`;
        throw createSendError(normalizeYouTubeSendCode(apiCode) || 'send_failed', data?.error?.message || '', data);
      }

      const actions = data?.actions || data?.continuationContents || data;
      const errText = JSON.stringify(data || {}).match(/"errorMessage(?:Text)?"\s*:\s*"([^"]+)"/);
      if (errText?.[1]) {
        throw createSendError('send_failed', errText[1], data);
      }
      if (data?.error) {
        throw createSendError(
          normalizeYouTubeSendCode(data.error.status || data.error.message) || 'send_failed',
          data.error.message || '',
          data,
        );
      }
      return { via: 'api', data: actions };
    } catch (error) {
      if (error?.code && error.code !== 'send_failed') throw error;
      // Fall through to DOM send when API params/session are stale.
    }
  }

  return sendViaDomFallback(text);
}

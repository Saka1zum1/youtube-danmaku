const HISTORY_PAGE_LIMIT = 4000;

function pageWindow() {
  return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
}

function currentVideoId() {
  try {
    const url = new URL(location.href);
    const fromQuery = url.searchParams.get('v');
    if (fromQuery) return fromQuery;
  } catch (_) {
    /* ignore */
  }
  const live = location.pathname.match(/^\/live\/([^/]+)/);
  return live?.[1] || 'youtube';
}

function currentDurationSeconds() {
  const video = document.querySelector('video.html5-main-video');
  if (video && Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  const seconds = Number(pageWindow().ytInitialPlayerResponse?.videoDetails?.lengthSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

function chatIframeSrc() {
  const iframe = document.querySelector(SELECTORS.chatFrame);
  return iframe?.src || '';
}

function liveChatRenderer() {
  return pageWindow().ytInitialData?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer
    || null;
}

function isLiveChatMode() {
  const src = chatIframeSrc();
  if (src.includes('live_chat_replay')) return false;
  if (src.includes('live_chat')) return true;
  const bar = liveChatRenderer();
  if (bar && typeof bar.isReplay === 'boolean') return bar.isReplay === false;
  return !!document.querySelector('.ytp-live-badge');
}

function readReplayContinuation() {
  const src = chatIframeSrc();
  if (src.includes('live_chat_replay')) {
    try {
      const token = new URL(src, location.origin).searchParams.get('continuation');
      if (token) return token;
    } catch (_) {
      /* ignore */
    }
  }
  const bar = liveChatRenderer();
  const token = bar?.continuations?.[0]?.reloadContinuationData?.continuation;
  if (!token) return '';
  if (bar.isReplay === false) return '';
  return token;
}

function readChatTimestampText(msgEl) {
  return msgEl.querySelector('#timestamp')?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function parseChatTimestamp(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return { time: '', offsetMs: null };

  // Live chat wall clock, e.g. "9:40 PM" / "9:40:12 PM"
  const wall = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
  if (wall) {
    let hours = Number(wall[1]);
    const minutes = Number(wall[2]);
    const seconds = Number(wall[3] || 0);
    const ampm = wall[4].toUpperCase();
    if (hours >= 1 && hours <= 12 && minutes <= 59 && seconds <= 59) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return {
        time: cleaned,
        offsetMs: ((hours * 3600) + (minutes * 60) + seconds) * 1000,
      };
    }
  }

  // Replay / video offset, e.g. "1:02:03" or "12:34"
  const video = cleaned.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (video) {
    const hours = Number(video[1] || 0);
    const minutes = Number(video[2]);
    const seconds = Number(video[3]);
    if (minutes <= 59 && seconds <= 59) {
      return {
        time: cleaned,
        offsetMs: ((hours * 3600) + (minutes * 60) + seconds) * 1000,
      };
    }
  }

  return { time: cleaned, offsetMs: null };
}

function historyTypeFromEl(msgEl) {
  const tag = msgEl.tagName;
  if (tag === 'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER' || tag === 'YT-LIVE-CHAT-PAID-STICKER-RENDERER') {
    return 'superchat';
  }
  if (tag === 'YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER') return 'member';
  return 'message';
}

function parseDomHistoryItem(msgEl, index) {
  if (!msgEl || msgEl.hasAttribute('is-deleted')) return null;

  const author = msgEl.querySelector('#author-name')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const amount = msgEl.querySelector('#purchase-amount, #purchase-amount-chip')
    ?.textContent?.replace(/\s+/g, ' ').trim() || '';

  const messageEl = msgEl.querySelector('#message');
  let message = messageEl ? partsToText(collectParts(messageEl)) : '';
  if (!message || msgEl.tagName === 'YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER') {
    const primary = partsToText(collectParts(msgEl.querySelector('#header-primary-text, #primary-text')));
    const sub = partsToText(collectParts(msgEl.querySelector('#header-subtext')));
    const headerText = [primary, sub].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    message = [headerText, message].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  if (!author && !message && !amount) return null;

  const stamp = parseChatTimestamp(readChatTimestampText(msgEl));
  return {
    id: msgEl.id || '',
    offsetMs: stamp.offsetMs == null ? index : stamp.offsetMs,
    time: stamp.time,
    author,
    message,
    amount,
    type: historyTypeFromEl(msgEl),
  };
}

async function collectLiveChatFromDom({ onProgress, shouldAbort, shouldPause } = {}) {
  await waitHistoryControl(shouldPause, shouldAbort);
  let list = getChatDocument()?.querySelector(SELECTORS.chatItems) || null;
  if (!list) {
    list = await waitForChatList(() => shouldAbort?.(), 8000);
  }
  if (!list) {
    const error = new Error('no-history');
    error.code = 'no-history';
    throw error;
  }

  const nodes = [...list.querySelectorAll(SELECTORS.chatMessage)];
  const items = [];
  const seen = new Set();

  for (let i = 0; i < nodes.length; i += 1) {
    if (i % 25 === 0) {
      await waitHistoryControl(shouldPause, shouldAbort);
      onProgress?.(items.length);
    }
    const item = parseDomHistoryItem(nodes[i], i);
    if (!item) continue;
    const key = item.id || `${item.offsetMs}:${item.author}:${item.message}:${item.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }

  onProgress?.(items.length);
  return items;
}

function runsToText(node) {
  if (!node) return '';
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (!Array.isArray(node.runs)) return '';
  return node.runs.map((run) => {
    if (run?.text) return run.text;
    const emoji = run?.emoji;
    return emoji?.shortcuts?.[0] || emoji?.emojiId || '';
  }).join('');
}

function parseHistoryRenderer(renderer, type, offsetMs) {
  if (!renderer) return null;
  const author = runsToText(renderer.authorName).replace(/\s+/g, ' ').trim();
  const message = (runsToText(renderer.message) || runsToText(renderer.headerSubtext) || '').replace(/\s+/g, ' ').trim();
  const amount = runsToText(renderer.purchaseAmountText).replace(/\s+/g, ' ').trim();
  if (!author && !message && !amount) return null;
  return {
    id: renderer.id || '',
    offsetMs,
    author,
    message,
    amount,
    type,
  };
}

function parseHistoryAction(action, fallbackOffset) {
  const replay = action?.replayChatItemAction;
  const offsetMs = Number(replay?.videoOffsetTimeMsec ?? fallbackOffset) || 0;
  const nested = replay?.actions || [action];
  const items = [];
  for (const entry of nested) {
    const item = entry?.addChatItemAction?.item;
    if (!item) continue;
    const parsed = parseHistoryRenderer(item.liveChatTextMessageRenderer, 'message', offsetMs)
      || parseHistoryRenderer(item.liveChatPaidMessageRenderer, 'superchat', offsetMs)
      || parseHistoryRenderer(item.liveChatPaidStickerRenderer, 'superchat', offsetMs)
      || parseHistoryRenderer(item.liveChatMembershipItemRenderer, 'member', offsetMs);
    if (parsed) items.push(parsed);
  }
  return items;
}

async function postReplayContinuation(token, offsetMs) {
  const page = pageWindow();
  const key = page.ytcfg?.get?.('INNERTUBE_API_KEY');
  const context = page.ytcfg?.get?.('INNERTUBE_CONTEXT');
  if (!key || !context || typeof page.fetch !== 'function') {
    const error = new Error('failed');
    error.code = 'failed';
    throw error;
  }
  const response = await page.fetch(
    `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat_replay?prettyPrint=false&key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        continuation: token,
        currentPlayerState: { playerOffsetMs: String(Math.max(0, Math.floor(offsetMs || 0))) },
      }),
    },
  );
  if (!response.ok) {
    const error = new Error('failed');
    error.code = 'failed';
    throw error;
  }
  return response.json();
}

async function waitHistoryControl(shouldPause, shouldAbort) {
  while (shouldPause?.()) {
    if (shouldAbort?.()) {
      const error = new Error('aborted');
      error.code = 'aborted';
      throw error;
    }
    await delay(120);
  }
  if (shouldAbort?.()) {
    const error = new Error('aborted');
    error.code = 'aborted';
    throw error;
  }
}

async function fetchLiveChatHistory({
  onProgress,
  shouldAbort,
  shouldPause,
  startMs = 0,
  endMs = Infinity,
} = {}) {
  if (isLiveChatMode()) {
    return collectLiveChatFromDom({ onProgress, shouldAbort, shouldPause });
  }

  let token = readReplayContinuation();
  if (!token) {
    await waitForElement(SELECTORS.chatFrame, document, 8000);
    token = readReplayContinuation();
  }
  if (!token) {
    const error = new Error('no-history');
    error.code = 'no-history';
    throw error;
  }

  const items = [];
  const seen = new Set();
  const seenTokens = new Set();
  let offset = Math.max(0, startMs);
  let pages = 0;

  while (token && pages < HISTORY_PAGE_LIMIT) {
    await waitHistoryControl(shouldPause, shouldAbort);
    if (seenTokens.has(token)) break;
    seenTokens.add(token);
    pages += 1;

    const data = await postReplayContinuation(token, offset);
    await waitHistoryControl(shouldPause, shouldAbort);
    const live = data?.continuationContents?.liveChatContinuation;
    if (!live) break;

    let pageMax = 0;
    for (const action of live.actions || []) {
      for (const item of parseHistoryAction(action, offset)) {
        pageMax = Math.max(pageMax, item.offsetMs);
        if (item.offsetMs < startMs || item.offsetMs > endMs) continue;
        const key = item.id || `${item.offsetMs}:${item.author}:${item.message}:${item.amount}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(item);
      }
    }
    onProgress?.(items.length);

    const next = live.continuations?.[0]?.liveChatReplayContinuationData;
    if (!next?.continuation) break;
    if (Number.isFinite(endMs) && pageMax > endMs) break;
    token = next.continuation;
    offset = pageMax || offset;
    await delay(60);
  }

  items.sort((a, b) => a.offsetMs - b.offsetMs);
  return items;
}

function splitHistoryTerms(value) {
  return String(value || '')
    .split(/[,，\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function filterLiveChatHistory(items, { keywords, usernames, includeSuperchat }) {
  const words = splitHistoryTerms(keywords);
  const names = splitHistoryTerms(usernames);
  return items.filter((item) => {
    if (item.type === 'superchat' && !includeSuperchat) return false;
    const message = `${item.amount} ${item.message}`.toLowerCase();
    const author = item.author.toLowerCase();
    if (words.length && !words.some((word) => message.includes(word))) return false;
    if (names.length && !names.some((name) => author.includes(name))) return false;
    return true;
  });
}

function formatHistoryClock(offsetMs) {
  const total = Math.max(0, Math.floor(Number(offsetMs) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function historyItemTime(item) {
  if (item?.time) return item.time;
  return formatHistoryClock(item?.offsetMs);
}

function formatHistoryRangeLabel(seconds) {
  return formatHistoryClock(Math.max(0, seconds) * 1000);
}

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportLiveChatText(items, format, videoId) {
  if (format === 'json') {
    return JSON.stringify({
      videoId,
      url: location.href,
      exportedAt: new Date().toISOString(),
      count: items.length,
      messages: items.map((item) => ({
        offsetMs: item.offsetMs,
        time: historyItemTime(item),
        author: item.author,
        message: item.message,
        type: item.type,
        amount: item.amount || undefined,
      })),
    }, null, 2);
  }
  if (format === 'csv') {
    const rows = ['offset_ms,time,author,message,type,amount'];
    for (const item of items) {
      rows.push([
        item.offsetMs,
        historyItemTime(item),
        item.author,
        item.message,
        item.type,
        item.amount || '',
      ].map(csvCell).join(','));
    }
    return `\uFEFF${rows.join('\n')}`;
  }
  return items.map((item) => {
    const amount = item.amount ? ` (${item.amount})` : '';
    return `[${historyItemTime(item)}] ${item.author}${amount}: ${item.message}`;
  }).join('\n');
}

function downloadLiveChatFile(items, format, videoId) {
  const ext = format === 'json' || format === 'csv' ? format : 'txt';
  const mime = format === 'json'
    ? 'application/json'
    : format === 'csv'
      ? 'text/csv'
      : 'text/plain';
  const blob = new Blob([exportLiveChatText(items, ext, videoId)], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `livechat_${videoId}.${ext}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

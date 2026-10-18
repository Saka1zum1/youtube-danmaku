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

function readReplayContinuation() {
  const iframe = document.querySelector('iframe#chatframe, ytd-live-chat-frame#chat iframe');
  const src = iframe?.src || '';
  if (src.includes('live_chat_replay')) {
    try {
      const token = new URL(src, location.origin).searchParams.get('continuation');
      if (token) return token;
    } catch (_) {
      /* ignore */
    }
  }
  const bar = pageWindow().ytInitialData?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer;
  const token = bar?.continuations?.[0]?.reloadContinuationData?.continuation;
  if (!token) return '';
  if (bar.isReplay === false) return '';
  return token;
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

async function fetchLiveChatHistory({ onProgress, shouldAbort, startMs = 0, endMs = Infinity } = {}) {
  let token = readReplayContinuation();
  if (!token) {
    await waitForElement('iframe#chatframe', document, 8000);
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
    if (shouldAbort?.()) {
      const error = new Error('aborted');
      error.code = 'aborted';
      throw error;
    }
    if (seenTokens.has(token)) break;
    seenTokens.add(token);
    pages += 1;

    const data = await postReplayContinuation(token, offset);
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
        time: formatHistoryClock(item.offsetMs),
        author: item.author,
        message: item.message,
        type: item.type
      })),
    }, null, 2);
  }
  if (format === 'csv') {
    const rows = ['offset_ms,time,author,message,type,amount'];
    for (const item of items) {
      rows.push([
        item.offsetMs,
        formatHistoryClock(item.offsetMs),
        item.author,
        item.message,
        item.type,
      ].map(csvCell).join(','));
    }
    return `\uFEFF${rows.join('\n')}`;
  }
  return items.map((item) => {
    const amount = item.amount ? ` (${item.amount})` : '';
    return `[${formatHistoryClock(item.offsetMs)}] ${item.author}${amount}: ${item.message}`;
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

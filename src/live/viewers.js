const VIEWERS_POLL_MS = 15000;

let metadataContinuation = '';
let metadataVideoId = '';

function livePageWindow() {
  return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
}

function liveVideoId() {
  try {
    const fromQuery = new URL(location.href).searchParams.get('v');
    if (fromQuery) return fromQuery;
  } catch (_) {
    /* ignore */
  }
  const live = location.pathname.match(/^\/live\/([^/]+)/);
  return live?.[1] || '';
}

function parseCompactCount(text) {
  const raw = String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  if (!raw) return null;
  const match = raw.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([KkMm万萬億bB百千])?/);
  if (!match) return null;
  let value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2] || '';
  if (/[Kk]/.test(unit)) value *= 1e3;
  else if (/[Mm]/.test(unit)) value *= 1e6;
  else if (/[Bb]/.test(unit)) value *= 1e9;
  else if (unit === '千') value *= 1e3;
  else if (unit === '万' || unit === '萬') value *= 1e4;
  else if (unit === '億') value *= 1e8;
  else if (unit === '百') value *= 1e2;
  return Math.round(value);
}

function runsOrText(node) {
  if (!node) return '';
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (typeof node === 'string') return node;
  if (!Array.isArray(node.runs)) return '';
  return node.runs.map((run) => run?.text || '').join('');
}

function walkForVideoViewCount(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 14) return null;
  if (node.videoViewCountRenderer) return node.videoViewCountRenderer;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkForVideoViewCount(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') {
      const found = walkForVideoViewCount(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function readViewCountRendererFromData() {
  const page = livePageWindow();
  const roots = [
    page.ytInitialData,
    page.ytInitialPlayerResponse,
  ].filter(Boolean);
  for (const root of roots) {
    const renderer = walkForVideoViewCount(root);
    if (renderer) return renderer;
  }
  return null;
}

function readViewersFromDom() {
  const nodes = document.querySelectorAll(
    'ytd-video-view-count-renderer .view-count, ytd-video-view-count-renderer span.yt-formatted-string, #info-container #info span.yt-formatted-string, ytd-watch-metadata #info span.yt-formatted-string',
  );
  for (const node of nodes) {
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!text) continue;
    if (/watching|視聴|在看|watching now/i.test(text)) {
      const count = parseCompactCount(text);
      if (count != null) return { concurrent: count, concurrentText: text };
    }
  }
  return { concurrent: null, concurrentText: '' };
}

function readTotalViewsFromPlayer() {
  const details = livePageWindow().ytInitialPlayerResponse?.videoDetails;
  const raw = details?.viewCount;
  const total = Number(raw);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

function isCurrentlyLive() {
  if (document.querySelector('.ytp-time-display.ytp-live, .ytp-live-badge')) return true;
  const details = livePageWindow().ytInitialPlayerResponse?.videoDetails;
  if (details?.isLive) return true;
  const micro = livePageWindow().ytInitialPlayerResponse?.microformat?.playerMicroformatRenderer;
  if (micro?.liveBroadcastDetails?.isLiveNow) return true;
  const renderer = readViewCountRendererFromData();
  return !!renderer?.isLive;
}

function readViewersFromPageData() {
  const renderer = readViewCountRendererFromData();
  let concurrent = null;
  let concurrentText = '';
  if (renderer) {
    concurrentText = runsOrText(renderer.viewCount) || runsOrText(renderer.shortViewCount) || '';
    if (renderer.isLive || /watching|視聴|在看/i.test(concurrentText)) {
      concurrent = parseCompactCount(concurrentText);
    }
  }
  const total = readTotalViewsFromPlayer();
  return { concurrent, concurrentText, total };
}

async function postInnertube(path, body) {
  const page = livePageWindow();
  const key = page.ytcfg?.get?.('INNERTUBE_API_KEY');
  const context = page.ytcfg?.get?.('INNERTUBE_CONTEXT');
  if (!key || !context || typeof page.fetch !== 'function') return null;
  try {
    const response = await page.fetch(
      `https://www.youtube.com/youtubei/v1/${path}?prettyPrint=false&key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, ...body }),
      },
    );
    if (!response.ok) return null;
    return response.json();
  } catch (_) {
    return null;
  }
}

function extractViewersFromRenderer(renderer) {
  if (!renderer) return { concurrent: null, concurrentText: '' };
  const concurrentText = runsOrText(renderer.viewCount) || runsOrText(renderer.shortViewCount) || '';
  const concurrent = (renderer.isLive || /watching|視聴|在看/i.test(concurrentText))
    ? parseCompactCount(concurrentText)
    : parseCompactCount(concurrentText);
  return { concurrent, concurrentText };
}

function extractViewersFromNext(data) {
  return extractViewersFromRenderer(walkForVideoViewCount(data));
}

function extractTotalFromPlayer(data) {
  const total = Number(data?.videoDetails?.viewCount);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

function extractContinuation(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.continuation === 'string' && data.continuation) return data.continuation;
  const items = data.continuations || data.actions || [];
  if (Array.isArray(items)) {
    for (const item of items) {
      const token = item?.nextContinuationData?.continuation
        || item?.reloadContinuationData?.continuation
        || item?.timedContinuationData?.continuation
        || item?.continuation;
      if (typeof token === 'string' && token) return token;
    }
  }
  return '';
}

function extractFromUpdatedMetadata(data) {
  let concurrent = null;
  let concurrentText = '';
  let total = null;

  const list = Array.isArray(data?.actions) ? data.actions : [];

  for (const action of list) {
    const viewership = action?.updateViewershipAction?.viewCount
      || action?.updateViewershipAction
      || action?.viewCount;
    const renderer = viewership?.videoViewCountRenderer
      || walkForVideoViewCount(viewership)
      || walkForVideoViewCount(action);
    if (renderer) {
      const extracted = extractViewersFromRenderer(renderer);
      if (extracted.concurrent != null) {
        concurrent = extracted.concurrent;
        concurrentText = extracted.concurrentText || concurrentText;
      } else if (extracted.concurrentText) {
        concurrentText = extracted.concurrentText;
        concurrent = parseCompactCount(extracted.concurrentText);
      }
    }

    const viewCountText = action?.updateViewershipAction?.viewCountText
      || action?.viewCountText
      || runsOrText(action?.updateViewershipAction?.viewCount);
    if (!concurrentText && viewCountText) {
      concurrentText = String(viewCountText);
      concurrent = parseCompactCount(concurrentText);
    }
  }

  // Some payloads expose top-level view count fields (live = watching now).
  if (concurrent == null) {
    const topText = data?.viewCountText || runsOrText(data?.viewCount);
    if (topText) {
      concurrentText = String(topText);
      concurrent = parseCompactCount(concurrentText);
    } else if (data?.viewCount != null && (typeof data.viewCount === 'string' || typeof data.viewCount === 'number')) {
      concurrent = parseCompactCount(String(data.viewCount));
    }
  }

  if (data?.isLive === false && concurrent != null) {
    total = concurrent;
    concurrent = null;
  }

  return {
    concurrent,
    concurrentText,
    total,
    continuation: extractContinuation(data),
  };
}

async function fetchUpdatedMetadata(videoId) {
  if (!videoId) return null;
  if (metadataVideoId !== videoId) {
    metadataVideoId = videoId;
    metadataContinuation = '';
  }

  const body = metadataContinuation
    ? { continuation: metadataContinuation }
    : { videoId };
  const data = await postInnertube('updated_metadata', body);
  if (!data && metadataContinuation) {
    metadataContinuation = '';
    return postInnertube('updated_metadata', { videoId });
  }
  return data;
}

async function fetchLiveViewers(videoId) {
  const live = isCurrentlyLive();
  const fallback = readViewersFromPageData();
  const fromDom = readViewersFromDom();

  let concurrent = null;
  let concurrentText = '';
  let total = null;

  if (videoId) {
    const [metaData, playerData] = await Promise.all([
      fetchUpdatedMetadata(videoId),
      postInnertube('player', {
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    ]);

    if (metaData) {
      const meta = extractFromUpdatedMetadata(metaData);
      if (meta.continuation) metadataContinuation = meta.continuation;
      if (meta.concurrent != null) {
        concurrent = meta.concurrent;
        concurrentText = meta.concurrentText || concurrentText;
      }
      if (meta.total != null) total = meta.total;
    }

    // If metadata didn't yield concurrent, try a fresh next response.
    if (concurrent == null) {
      const nextData = await postInnertube('next', { videoId });
      if (nextData) {
        const extracted = extractViewersFromNext(nextData);
        if (extracted.concurrent != null) {
          concurrent = extracted.concurrent;
          concurrentText = extracted.concurrentText || concurrentText;
        }
      }
    }

    if (playerData) {
      const playerTotal = extractTotalFromPlayer(playerData);
      if (playerTotal != null) total = playerTotal;
      try {
        const page = livePageWindow();
        if (page.ytInitialPlayerResponse?.videoDetails && playerData.videoDetails?.viewCount != null) {
          page.ytInitialPlayerResponse.videoDetails.viewCount = String(playerData.videoDetails.viewCount);
        }
      } catch (_) {
        /* ignore */
      }
    }
  }

  // Last resort: current DOM / initial page snapshot (may be stale).
  if (concurrent == null) {
    concurrent = fromDom.concurrent ?? fallback.concurrent;
    concurrentText = fromDom.concurrentText || fallback.concurrentText || concurrentText;
  }
  if (total == null) total = fallback.total;

  return {
    live,
    concurrent,
    concurrentText,
    total,
  };
}

function formatCountNumber(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return '';
  try {
    return new Intl.NumberFormat(undefined, { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
  } catch (_) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
    return String(Math.round(n));
  }
}

function formatLiveConcurrentLabel(count) {
  if (count == null) return 'Live';
  return `Live · ${formatCountNumber(count)} ${t('liveWatching')}`;
}

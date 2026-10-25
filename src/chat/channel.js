function pageWin() {
  return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
}

function currentChannelId() {
  const page = pageWin();
  const fromPlayer = page.ytInitialPlayerResponse?.videoDetails?.channelId;
  if (fromPlayer) return String(fromPlayer);
  try {
    const fromCfg = page.ytcfg?.get?.('CHANNEL_ID') || page.ytcfg?.data_?.CHANNEL_ID;
    if (fromCfg) return String(fromCfg);
  } catch (_) {
    /* ignore */
  }
  const link = document.querySelector(
    'ytd-video-owner-renderer a[href*="/channel/"], #owner #channel-name a[href*="/channel/"]',
  );
  const match = link?.getAttribute('href')?.match(/\/channel\/([^/?#]+)/);
  return match?.[1] || '';
}

function currentChannelLabel() {
  const page = pageWin();
  const author = page.ytInitialPlayerResponse?.videoDetails?.author;
  if (author) return String(author).trim();
  const name = document.querySelector(
    'ytd-video-owner-renderer #channel-name a, #owner #channel-name yt-formatted-string',
  )?.textContent?.replace(/\s+/g, ' ').trim();
  return name || currentChannelId();
}

function sanitizeChannelKey(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (/^UC[\w-]{20,}$/i.test(text)) return text;
  return text.replace(/^@+/, '').slice(0, 64) || null;
}

function isLiveWatchMode() {
  if (document.documentElement.dataset.ydmPreview === 'true') return true;
  const page = pageWin();
  if (page.ytInitialPlayerResponse?.videoDetails?.isLive) return true;
  if (page.ytInitialPlayerResponse?.videoDetails?.isLiveContent) return true;
  return !!document.querySelector('.ytp-live-badge, .ytp-live');
}

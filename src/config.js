const SCROLL_AREA_BOTTOM_RESERVE = 56;

const DEFAULT_SETTINGS = {
  enabled: true,
  speed: 5,
  fontSize: 22,
  fontFamily: 'system-ui, sans-serif',
  scrollArea: 'full',
  translateEnabled: false,
  translateProvider: 'microsoft',
  translateTargetLang: getDefaultTranslateTargetLang(),
  translateSpeed: 3,
};

const SELECTORS = {
  player: 'ytd-watch-flexy #movie_player, ytd-player#ytd-player #movie_player',
  playerControls: 'ytd-watch-flexy #movie_player .ytp-right-controls, ytd-player#ytd-player #movie_player .ytp-right-controls',
  playerChrome: '.ytp-chrome-bottom',
  chatFrame: 'ytd-live-chat-frame#chat iframe, iframe#chatframe',
  chatHost: 'ytd-live-chat-frame#chat',
  chatItems: 'yt-live-chat-item-list-renderer #items, #items.yt-live-chat-item-list-renderer',
  chatMessage: [
    'yt-live-chat-text-message-renderer',
    'yt-live-chat-paid-message-renderer',
    'yt-live-chat-paid-sticker-renderer',
    'yt-live-chat-membership-item-renderer',
  ].join(', '),
  chatInput: '#input.yt-live-chat-text-input-field-renderer, yt-live-chat-text-input-field-renderer #input[contenteditable]',
};

const TRANSLATE_PROVIDERS = ['auto', 'microsoft', 'google', 'volcengine', 'caiyun', 'tencent'];

const STORAGE_KEY = 'ydm_settings_v1';

const LIVE_MESSAGE_TAIL = 8;
const WARMUP_MS = 2500;
const MAX_DANMAKU_QUEUE = 24;
const MAX_TRANSLATE_QUEUE = 32;

const NAME_COLORS = [
  '#ff8a80', '#ffd180', '#ffff8d', '#ccff90', '#b9f6ca',
  '#84ffff', '#80d8ff', '#82b1ff', '#b388ff', '#ea80fc',
  '#f8bbd0', '#ff9e80', '#ffab91', '#c5e1a5',
];

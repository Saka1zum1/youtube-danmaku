const SCROLL_AREA_BOTTOM_RESERVE = 56;

const DEFAULT_SETTINGS = {
  enabled: true,
  speed: 5,
  fontSize: 22,
  opacity: 100,
  fontFamily: 'system-ui, sans-serif',
  scrollArea: 'full',
  translateEnabled: false,
  translateInChat: false,
  translateProvider: 'microsoft',
  translateTargetLang: getDefaultTranslateTargetLang(),
  translateSpeed: 3,
  blockKeywords: [],
  speechEnabled: false,
  speechVolume: 80,
  speechPitch: 100,
  speechVoice: '',
  speechLang: '',
  speechRate: 100,
  speechPace: true,
  speechMaxSeconds: 4,
  speechBuffer: 5,
  superchatPinned: false,
  superchatPosition: 'top',
  superchatDuration: 15,
  /** When true, pin lifetime follows the YouTube live-chat ticker countdown. */
  superchatDurationFollowYoutube: false,
  superchatAnimation: 'slide',
  /** Compact pin: avatar + name + amount; click opens a centered detail card. */
  superchatCompact: false,
  /** When true, pinned Super Chats may cover scrolling danmaku (no lane reserve). */
  superchatOverlayDanmaku: true,
};

const SUPERCHAT_MAX_PINNED = 10;

const SUPERCHAT_POSITIONS = ['top', 'top-left', 'bottom', 'bottom-left', 'bottom-right'];
const SCROLL_AREAS = ['full', 'top-half', 'bottom-half', 'top-quarter'];

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

// ==UserScript==
// @name         YouTube Danmaku - Bullet Chat
// @name:zh-CN   YouTube 弹幕
// @name:zh-TW   YouTube 彈幕
// @name:ja      YouTube 弾幕
// @namespace    youtube-danmaku
// @version      1.2.1
// @description  Turn YouTube live chat into scrolling danmaku on the video, with optional read-aloud
// @description:zh-CN  将 YouTube 直播聊天转换为视频上的滚动弹幕，支持暂停、复制、朗读与实时翻译
// @description:zh-TW  將 YouTube 直播聊天轉換成影片上的滾動彈幕，支援暫停、複製、朗讀與即時翻譯
// @description:ja  YouTube のライブチャットを動画上に流れる弾幕に変換します。一時停止、コピー、読み上げ、リアルタイム翻訳に対応
// @author       youtube-danmaku
// @license      MIT
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @exclude      https://www.youtube.com/live_chat*
// @exclude      https://m.youtube.com/live_chat*
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      translate.googleapis.com
// @connect      edge.microsoft.com
// @connect      api-edge.cognitive.microsofttranslator.com
// @connect      transmart.qq.com
// @connect      translate.volcengine.com
// @connect      api.interpreter.caiyunai.com
// @run-at       document-idle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// ==/UserScript==

(function () {
'use strict';
const LOCALES = {
  zh: {
    danmakuToggle: '弹幕开关',
    danmakuOn: '关闭弹幕',
    danmakuOff: '开启弹幕',
    settingsToggle: '弹幕设置',
    panelTitle: '弹幕设置',
    panelClose: '关闭',
    scrollSpeed: '滚动速度',
    fontSize: '字体大小',
    danmakuOpacity: '弹幕透明度',
    fontFamily: '字体',
    scrollArea: '滚动区域',
    translateEnable: '启用翻译',
    translateProvider: '翻译引擎',
    translateProviderAuto: '自动切换',
    translateProviderMicrosoft: 'Microsoft 翻译',
    translateProviderGoogle: 'Google 翻译',
    translateProviderVolcengine: '火山翻译',
    translateProviderCaiyun: '彩云小译',
    translateProviderTencent: '腾讯交互翻译',
    translateTarget: '目标语言',
    translateSpeed: '翻译速度',
    translateSpeedUnit: '条/秒',
    scrollAreaFull: '全屏',
    scrollAreaTopHalf: '上半屏',
    scrollAreaTopQuarter: '顶部 1/4',
    fontSystem: '系统默认',
    fontYaHei: '微软雅黑',
    fontSimSun: '宋体',
    fontSimHei: '黑体',
    fontArial: 'Arial',
    fontRoboto: 'Roboto',
    fontImpact: 'Impact',
    fontGeorgia: 'Georgia',
    fontTimes: 'Times New Roman',
    fontVerdana: 'Verdana',
    fontTahoma: 'Tahoma',
    fontTrebuchet: 'Trebuchet MS',
    fontCourier: 'Courier New',
    fontConsolas: 'Consolas',
    fontComicSans: 'Comic Sans MS',
    fontSerif: 'Serif 衬线',
    fontSansSerif: 'Sans-serif 无衬线',
    fontMonospace: 'Monospace 等宽',
    langZhCN: '简体中文',
    langZhTW: '繁体中文',
    langEn: 'English',
    langJa: '日本語',
    langKo: '한국어',
    langEs: 'Español',
    langFr: 'Français',
    langDe: 'Deutsch',
    langRu: 'Русский',
    langPt: 'Português',
    tooltipCopy: '复制到聊天框',
    tooltipOpenProfile: '打开发送者主页',
    blockKeywords: '屏蔽关键词',
    blockKeywordHint: '原文和译文都会屏蔽',
    blockKeywordPlaceholder: '输入关键词',
    blockKeywordAdd: '添加',
    blockKeywordRemove: '移除关键词',
    speechToggle: '弹幕朗读',
    speechPanelTitle: '弹幕朗读',
    speechEnable: '启用朗读',
    speechOn: '朗读已开启',
    speechMute: '朗读已静音',
    speechOff: '朗读已关闭',
    speechTest: '试读',
    speechTestText: '这是一条测试弹幕 ABC',
    speechPlay: '按设定速度试读',
    speechPlayFast: '按变速模式试读',
    speechVolume: '音量',
    speechPitch: '音高',
    speechVoice: '声音',
    speechVoiceLang: '语言',
    speechVoiceDefault: '默认',
    speechRate: '朗读速度',
    speechPace: '变速模式',
    speechMaxSeconds: '单条最长',
    speechSeconds: '秒',
    speechPaceHint: '超出最长朗读时间时自动加快。开启翻译后按译文长度计算。重复内容最多读 3 遍，纯符号、纯表情和纯数字不朗读。',
    speechBuffer: '保留条数',
    speechBufferHint: '超过这个数量时丢掉更早的弹幕，避免朗读一直追不上',
    speechUnsupported: '当前浏览器不支持语音朗读',
    tooltipSpeak: '朗读这条弹幕',
    superchatPinned: 'Super Chat 悬停',
    superchatPosition: '悬停位置',
    superchatDuration: '悬停时间',
    superchatAnimation: '悬停动画',
    superchatTop: '顶部',
    superchatBottom: '底部',
    superchatFade: '淡入淡出',
    superchatSlide: '滑入',
    superchatPop: '弹出',
    superchatShine: '闪光',
    historyToggle: '下载聊天记录',
    historyPanelTitle: '下载聊天记录',
    historyHint: '读取已保留的聊天回放。聊天需嵌在页面右侧。关键词和用户名留空表示不筛选，多个用逗号分隔。',
    historyKeywords: '内容关键词',
    historyKeywordsHint: '只保留包含这些词的消息',
    historyUsernames: '用户名',
    historyUsernamesHint: '只保留这些用户的消息',
    historySuperchat: '包含 Super Chat',
    historyRange: '时间范围',
    historyNoDuration: '还没读到视频时长，将导出全部时间。',
    historyFormat: '导出格式',
    historyDownload: '下载',
    historyPause: '暂停',
    historyResume: '继续',
    historyCancel: '取消',
    historyDownloading: '正在读取聊天回放…',
    historyPaused: '已暂停',
    historyCancelled: '已取消下载。',
    historyProgress: '已读取',
    historyDone: '已导出',
    historyNone: '没有可下载的聊天回放。请确认这是保留了聊天的直播回放，并且聊天嵌在页面右侧。',
    historyFailed: '读取聊天回放失败，请稍后重试。',
    historyEmpty: '筛选后没有消息。',
  },
  en: {
    danmakuToggle: 'Danmaku toggle',
    danmakuOn: 'Turn off danmaku',
    danmakuOff: 'Turn on danmaku',
    settingsToggle: 'Danmaku settings',
    panelTitle: 'Danmaku Settings',
    panelClose: 'Close',
    scrollSpeed: 'Scroll speed',
    fontSize: 'Font size',
    danmakuOpacity: 'Danmaku opacity',
    fontFamily: 'Font',
    scrollArea: 'Scroll area',
    translateEnable: 'Enable translation',
    translateProvider: 'Translation engine',
    translateProviderAuto: 'Auto',
    translateProviderMicrosoft: 'Microsoft Translator',
    translateProviderGoogle: 'Google Translate',
    translateProviderVolcengine: 'Volcengine',
    translateProviderCaiyun: 'Caiyun',
    translateProviderTencent: 'Tencent Transmart',
    translateTarget: 'Target language',
    translateSpeed: 'Translation speed',
    translateSpeedUnit: '/sec',
    scrollAreaFull: 'Full screen',
    scrollAreaTopHalf: 'Top half',
    scrollAreaTopQuarter: 'Top quarter',
    fontSystem: 'System default',
    fontYaHei: 'Microsoft YaHei',
    fontSimSun: 'SimSun',
    fontSimHei: 'SimHei',
    fontArial: 'Arial',
    fontRoboto: 'Roboto',
    fontImpact: 'Impact',
    fontGeorgia: 'Georgia',
    fontTimes: 'Times New Roman',
    fontVerdana: 'Verdana',
    fontTahoma: 'Tahoma',
    fontTrebuchet: 'Trebuchet MS',
    fontCourier: 'Courier New',
    fontConsolas: 'Consolas',
    fontComicSans: 'Comic Sans MS',
    fontSerif: 'Serif',
    fontSansSerif: 'Sans-serif',
    fontMonospace: 'Monospace',
    langZhCN: 'Chinese (Simplified)',
    langZhTW: 'Chinese (Traditional)',
    langEn: 'English',
    langJa: 'Japanese',
    langKo: 'Korean',
    langEs: 'Spanish',
    langFr: 'French',
    langDe: 'German',
    langRu: 'Russian',
    langPt: 'Portuguese',
    tooltipCopy: 'Copy to chat',
    tooltipOpenProfile: 'Open sender profile',
    blockKeywords: 'Blocked keywords',
    blockKeywordHint: 'Matches the original text and the translation',
    blockKeywordPlaceholder: 'Add a keyword',
    blockKeywordAdd: 'Add',
    blockKeywordRemove: 'Remove keyword',
    speechToggle: 'Read danmaku',
    speechPanelTitle: 'Read danmaku',
    speechEnable: 'Read danmaku aloud',
    speechOn: 'Reading is on',
    speechMute: 'Reading is muted',
    speechOff: 'Reading is off',
    speechTest: 'Trial',
    speechTestText: 'This is a test ABC',
    speechPlay: 'Play at set speed',
    speechPlayFast: 'Play with pace mode',
    speechVolume: 'Volume',
    speechPitch: 'Pitch',
    speechVoice: 'Voice',
    speechVoiceLang: 'Language',
    speechVoiceDefault: 'Default',
    speechRate: 'Reading speed',
    speechPace: 'Pace mode',
    speechMaxSeconds: 'Max per line',
    speechSeconds: 'sec',
    speechPaceHint: 'Speed up when a line would exceed the max time. With translation on, length uses the translated text. Repeated phrases are read at most 3 times. Symbols, emotes, and numbers alone are skipped.',
    speechBuffer: 'Keep latest',
    speechBufferHint: 'Older lines beyond this count are dropped so reading can catch up',
    speechUnsupported: 'Speech synthesis is not available in this browser',
    tooltipSpeak: 'Read this danmaku',
    superchatPinned: 'Pin Super Chats',
    superchatPosition: 'Pin position',
    superchatDuration: 'Pin time',
    superchatAnimation: 'Pin animation',
    superchatTop: 'Top',
    superchatBottom: 'Bottom',
    superchatFade: 'Fade',
    superchatSlide: 'Slide',
    superchatPop: 'Pop',
    superchatShine: 'Shine',
    historyToggle: 'Download chat history',
    historyPanelTitle: 'Download chat history',
    historyHint: 'Reads the saved chat replay. Keep chat docked on the page. Leave keywords and usernames empty to skip those filters. Separate multiple values with commas.',
    historyKeywords: 'Keywords',
    historyKeywordsHint: 'Keep messages that contain these words',
    historyUsernames: 'Usernames',
    historyUsernamesHint: 'Keep messages from these users',
    historySuperchat: 'Include Super Chat',
    historyRange: 'Time range',
    historyNoDuration: 'Video length is not ready yet. The export will include the full timeline.',
    historyFormat: 'Export format',
    historyDownload: 'Download',
    historyPause: 'Pause',
    historyResume: 'Resume',
    historyCancel: 'Cancel',
    historyDownloading: 'Reading chat replay…',
    historyPaused: 'Paused',
    historyCancelled: 'Download cancelled.',
    historyProgress: 'Loaded',
    historyDone: 'Exported',
    historyNone: 'No chat replay to download. Open an archived live with chat saved, and keep that chat docked on the page.',
    historyFailed: 'Could not read the chat replay. Try again later.',
    historyEmpty: 'No messages match these filters.',
  },
  ja: {
    danmakuToggle: '弾幕の切替',
    danmakuOn: '弾幕をオフ',
    danmakuOff: '弾幕をオン',
    settingsToggle: '弾幕設定',
    panelTitle: '弾幕設定',
    panelClose: '閉じる',
    scrollSpeed: 'スクロール速度',
    fontSize: 'フォントサイズ',
    danmakuOpacity: '弾幕の透明度',
    fontFamily: 'フォント',
    scrollArea: '表示エリア',
    translateEnable: '翻訳を有効にする',
    translateProvider: '翻訳エンジン',
    translateProviderAuto: '自動',
    translateProviderMicrosoft: 'Microsoft Translator',
    translateProviderGoogle: 'Google 翻訳',
    translateProviderVolcengine: 'Volcengine',
    translateProviderCaiyun: '彩雲（Caiyun）',
    translateProviderTencent: '腾讯 Transmart',
    translateTarget: '翻訳先言語',
    translateSpeed: '翻訳速度',
    translateSpeedUnit: '件/秒',
    scrollAreaFull: '全画面',
    scrollAreaTopHalf: '上半分',
    scrollAreaTopQuarter: '上部 1/4',
    fontSystem: 'システム既定',
    fontYaHei: 'Microsoft YaHei',
    fontSimSun: 'SimSun（宋体）',
    fontSimHei: 'SimHei（黒体）',
    fontArial: 'Arial',
    fontRoboto: 'Roboto',
    fontImpact: 'Impact',
    fontGeorgia: 'Georgia',
    fontTimes: 'Times New Roman',
    fontVerdana: 'Verdana',
    fontTahoma: 'Tahoma',
    fontTrebuchet: 'Trebuchet MS',
    fontCourier: 'Courier New',
    fontConsolas: 'Consolas',
    fontComicSans: 'Comic Sans MS',
    fontSerif: 'Serif',
    fontSansSerif: 'Sans-serif',
    fontMonospace: 'Monospace',
    langZhCN: '中国語（簡体字）',
    langZhTW: '中国語（繁体字）',
    langEn: '英語',
    langJa: '日本語',
    langKo: '韓国語',
    langEs: 'スペイン語',
    langFr: 'フランス語',
    langDe: 'ドイツ語',
    langRu: 'ロシア語',
    langPt: 'ポルトガル語',
    tooltipCopy: 'チャット入力欄にコピー',
    tooltipOpenProfile: '送信者のプロフィールを開く',
    blockKeywords: 'ブロックするキーワード',
    blockKeywordHint: '原文と訳文の両方に適用されます',
    blockKeywordPlaceholder: 'キーワードを入力',
    blockKeywordAdd: '追加',
    blockKeywordRemove: 'キーワードを削除',
    speechToggle: '弾幕読み上げ',
    speechPanelTitle: '弾幕読み上げ',
    speechEnable: '読み上げを有効にする',
    speechOn: '読み上げオン',
    speechMute: '読み上げミュート',
    speechOff: '読み上げオフ',
    speechTest: '試し読み',
    speechTestText: 'これはテストです ABC',
    speechPlay: '設定速度で再生',
    speechPlayFast: '变速モードで再生',
    speechVolume: '音量',
    speechPitch: '高さ',
    speechVoice: '声',
    speechVoiceLang: '言語',
    speechVoiceDefault: 'デフォルト',
    speechRate: '読み上げ速度',
    speechPace: '变速モード',
    speechMaxSeconds: '1件の上限',
    speechSeconds: '秒',
    speechPaceHint: '上限時間を超えるときは自動で速くします。翻訳がオンのときは訳文の長さを使います。繰り返しは最大3回まで。記号だけ、絵文字だけ、数字だけは読み上げません。',
    speechBuffer: '追いかける件数',
    speechBufferHint: 'この件数より古い弾幕は捨てて、読み上げが遅れ続けないようにします',
    speechUnsupported: 'このブラウザは音声読み上げに対応していません',
    tooltipSpeak: 'この弾幕を読み上げる',
    superchatPinned: 'Super Chat を固定',
    superchatPosition: '固定位置',
    superchatDuration: '固定時間',
    superchatAnimation: '固定アニメーション',
    superchatTop: '上部',
    superchatBottom: '下部',
    superchatFade: 'フェード',
    superchatSlide: 'スライド',
    superchatPop: 'ポップ',
    superchatShine: 'シャイン',
    historyToggle: 'チャット履歴をダウンロード',
    historyPanelTitle: 'チャット履歴をダウンロード',
    historyHint: '保存されたチャットリプレイを読み取ります。チャットはページ右側にドックしたままにしてください。キーワードとユーザー名が空なら、その条件では絞り込みません。複数はカンマで区切ります。',
    historyKeywords: 'キーワード',
    historyKeywordsHint: 'これらの語を含むメッセージだけ残す',
    historyUsernames: 'ユーザー名',
    historyUsernamesHint: 'これらのユーザーのメッセージだけ残す',
    historySuperchat: 'Super Chat を含める',
    historyRange: '時間範囲',
    historyNoDuration: '動画の長さがまだ分かりません。全時間を書き出します。',
    historyFormat: '書き出し形式',
    historyDownload: 'ダウンロード',
    historyPause: '一時停止',
    historyResume: '再開',
    historyCancel: 'キャンセル',
    historyDownloading: 'チャットリプレイを読み取り中…',
    historyPaused: '一時停止中',
    historyCancelled: 'ダウンロードをキャンセルしました。',
    historyProgress: '読み取り済み',
    historyDone: '書き出し完了',
    historyNone: 'ダウンロードできるチャットリプレイがありません。チャットが残っているアーカイブを開き、チャットをページ右側にドックしてください。',
    historyFailed: 'チャットリプレイを読み取れませんでした。しばらくしてからもう一度試してください。',
    historyEmpty: '条件に合うメッセージがありません。',
  },
};

function detectLocale() {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    if (lang && /^zh(-|$)/i.test(lang)) return 'zh';
    if (lang && /^ja(-|$)/i.test(lang)) return 'ja';
  }
  return 'en';
}

const LOCALE = detectLocale();
const STRINGS = LOCALES[LOCALE];

function t(key) {
  return STRINGS[key] || LOCALES.en[key] || key;
}

function getFontOptions() {
  return [
    { label: t('fontSystem'), value: 'system-ui, sans-serif' },
    { label: t('fontYaHei'), value: '"Microsoft YaHei", sans-serif' },
    { label: t('fontSimSun'), value: 'SimSun, serif' },
    { label: t('fontSimHei'), value: 'SimHei, sans-serif' },
    { label: t('fontArial'), value: 'Arial, Helvetica, sans-serif' },
    { label: t('fontRoboto'), value: 'Roboto, sans-serif' },
    { label: t('fontVerdana'), value: 'Verdana, Geneva, sans-serif' },
    { label: t('fontTahoma'), value: 'Tahoma, Geneva, sans-serif' },
    { label: t('fontTrebuchet'), value: '"Trebuchet MS", sans-serif' },
    { label: t('fontGeorgia'), value: 'Georgia, serif' },
    { label: t('fontTimes'), value: '"Times New Roman", Times, serif' },
    { label: t('fontCourier'), value: '"Courier New", Courier, monospace' },
    { label: t('fontConsolas'), value: 'Consolas, monospace' },
    { label: t('fontImpact'), value: 'Impact, Haettenschweiler, sans-serif' },
    { label: t('fontComicSans'), value: '"Comic Sans MS", cursive, sans-serif' },
    { label: t('fontSerif'), value: 'serif' },
    { label: t('fontSansSerif'), value: 'sans-serif' },
    { label: t('fontMonospace'), value: 'monospace' },
  ];
}

function getSuperchatPositionOptions() {
  return [
    { label: t('superchatTop'), value: 'top' },
    { label: t('superchatBottom'), value: 'bottom' },
  ];
}

function getSuperchatAnimationOptions() {
  return [
    { label: t('superchatFade'), value: 'fade' },
    { label: t('superchatSlide'), value: 'slide' },
    { label: t('superchatPop'), value: 'pop' },
    { label: t('superchatShine'), value: 'shine' },
  ];
}

function getScrollAreaOptions() {
  return [
    { label: t('scrollAreaFull'), value: 'full' },
    { label: t('scrollAreaTopHalf'), value: 'top-half' },
    { label: t('scrollAreaTopQuarter'), value: 'top-quarter' },
  ];
}

function getTranslateProviderOptions() {
  return [
    { label: t('translateProviderAuto'), value: 'auto' },
    { label: t('translateProviderMicrosoft'), value: 'microsoft' },
    { label: t('translateProviderGoogle'), value: 'google' },
    { label: t('translateProviderVolcengine'), value: 'volcengine' },
    { label: t('translateProviderCaiyun'), value: 'caiyun' },
    { label: t('translateProviderTencent'), value: 'tencent' },
  ];
}

function getTranslateLangOptions() {
  return [
    { label: t('langZhCN'), value: 'zh-CN' },
    { label: t('langZhTW'), value: 'zh-TW' },
    { label: t('langEn'), value: 'en' },
    { label: t('langJa'), value: 'ja' },
    { label: t('langKo'), value: 'ko' },
    { label: t('langEs'), value: 'es' },
    { label: t('langFr'), value: 'fr' },
    { label: t('langDe'), value: 'de' },
    { label: t('langRu'), value: 'ru' },
    { label: t('langPt'), value: 'pt' },
  ];
}

function getDefaultTranslateTargetLang() {
  if (LOCALE === 'zh') return 'zh-CN';
  if (LOCALE === 'ja') return 'ja';
  return 'en';
}

const SCROLL_AREA_BOTTOM_RESERVE = 56;

const DEFAULT_SETTINGS = {
  enabled: true,
  speed: 5,
  fontSize: 22,
  opacity: 100,
  fontFamily: 'system-ui, sans-serif',
  scrollArea: 'full',
  translateEnabled: false,
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
  superchatDuration: 6,
  superchatAnimation: 'slide',
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

function loadSettings() {
  try {
    const saved = GM_getValue(STORAGE_KEY, null);
    if (saved && typeof saved === 'object') {
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      if (merged.scrollArea === 'half') {
        merged.scrollArea = 'top-half';
      }
      if (!TRANSLATE_PROVIDERS.includes(merged.translateProvider)) {
        merged.translateProvider = DEFAULT_SETTINGS.translateProvider;
      }
      merged.blockKeywords = normalizeBlockKeywords(merged.blockKeywords);
      merged.opacity = clamp(Number(merged.opacity) || DEFAULT_SETTINGS.opacity, 10, 100);
      if (typeof merged.speechEnabled !== 'boolean') {
        merged.speechEnabled = merged.speechMode === 'on' || merged.speechMode === 'mute';
        if (merged.speechMode === 'mute') merged.speechVolume = 0;
      }
      delete merged.speechMode;
      delete merged.speechFastest;
      merged.speechVolume = clamp(finiteNumber(merged.speechVolume, DEFAULT_SETTINGS.speechVolume), 0, 100);
      merged.speechPitch = clamp(finiteNumber(merged.speechPitch, DEFAULT_SETTINGS.speechPitch), 0, 200);
      merged.speechRate = clamp(finiteNumber(merged.speechRate, DEFAULT_SETTINGS.speechRate), 50, 200);
      merged.speechPace = !!merged.speechPace;
      merged.speechMaxSeconds = clamp(finiteNumber(merged.speechMaxSeconds, DEFAULT_SETTINGS.speechMaxSeconds), 1, 15);
      merged.speechBuffer = clamp(finiteNumber(merged.speechBuffer, DEFAULT_SETTINGS.speechBuffer), 1, 25);
      merged.speechVoice = typeof merged.speechVoice === 'string' ? merged.speechVoice : '';
      merged.speechLang = typeof merged.speechLang === 'string' ? merged.speechLang : '';
      merged.superchatPinned = !!merged.superchatPinned;
      if (!['top', 'bottom'].includes(merged.superchatPosition)) merged.superchatPosition = 'top';
      if (!['fade', 'slide', 'pop', 'shine'].includes(merged.superchatAnimation)) merged.superchatAnimation = 'slide';
      merged.superchatDuration = clamp(finiteNumber(merged.superchatDuration, DEFAULT_SETTINGS.superchatDuration), 2, 15);
      return merged;
    }
  } catch (_) {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS, blockKeywords: [] };
}

function saveSettings(settings) {
  GM_setValue(STORAGE_KEY, settings);
}

function normalizeBlockKeywords(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const words = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const word = item.trim().slice(0, 40);
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
    if (words.length >= 50) break;
  }
  return words;
}

function messageMatchesBlock(text, keywords) {
  const haystack = String(text || '').toLowerCase();
  if (!haystack || !keywords?.length) return false;
  return keywords.some((word) => {
    const needle = String(word || '').trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isPageActive() {
  return !document.hidden && document.visibilityState === 'visible';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSvg(markup) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const viewBox = markup.match(/\bviewBox="([^"]*)"/i);
  if (viewBox) svg.setAttribute('viewBox', viewBox[1]);
  svg.setAttribute('aria-hidden', 'true');

  const tags = markup.match(/<(?:path|circle|rect|polygon)\b[^>]*\/?>/gi) || [];
  for (const tag of tags) {
    const name = tag.match(/^<([\w:-]+)/)[1];
    const shape = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const attr of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
      shape.setAttribute(attr[1], attr[2]);
    }
    svg.appendChild(shape);
  }
  return svg;
}

function appendMarkup(parent, markup) {
  const parts = markup.match(/<span\b[^>]*>[\s\S]*?<\/span>|<svg\b[\s\S]*?<\/svg>/gi) || [];
  for (const part of parts) {
    if (/^<span/i.test(part)) {
      const span = document.createElement('span');
      const className = part.match(/\bclass="([^"]*)"/i);
      if (className) span.className = className[1];
      const svgMarkup = part.match(/<svg\b[\s\S]*?<\/svg>/i);
      if (svgMarkup) span.appendChild(createSvg(svgMarkup[0]));
      parent.appendChild(span);
      continue;
    }
    parent.appendChild(createSvg(part));
  }
}

function waitForElement(selector, root = document, timeout = 30000) {
  return new Promise((resolve) => {
    const existing = root.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    if (timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    }
  });
}

function getFullscreenElement() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || null;
}

function getDanmakuMount(item) {
  return item.closest('.ydm-danmaku-layer')?.parentElement || null;
}

function getPlayerElement() {
  return document.querySelector(SELECTORS.player);
}

function getChatDocument() {
  const iframe = document.querySelector(SELECTORS.chatFrame);
  if (iframe) {
    try {
      const doc = iframe.contentDocument;
      if (doc?.querySelector(SELECTORS.chatItems)) return doc;
    } catch (_) {
      return null;
    }
    return null;
  }

  const host = document.querySelector(SELECTORS.chatHost);
  if (host?.querySelector(SELECTORS.chatItems)) return document;
  return null;
}

async function waitForChatList(shouldAbort, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (shouldAbort?.()) return null;
    const list = getChatDocument()?.querySelector(SELECTORS.chatItems) || null;
    if (list) return list;
    await delay(300);
  }
  return null;
}

function isNeutralColor(color) {
  const match = String(color).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) return false;
  const channels = match.slice(1, 4).map(Number);
  return Math.max(...channels) - Math.min(...channels) < 24;
}

function colorFromName(name) {
  const text = name || '?';
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return NAME_COLORS[(hash >>> 0) % NAME_COLORS.length];
}

function safeCssColor(color) {
  const value = String(color || '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (/^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value)) {
    return value;
  }
  return '#ffffff';
}

function getUsernameColor(msgEl, username) {
  const type = (msgEl.getAttribute('author-type') || '').toLowerCase();
  if (type === 'owner') return '#ffd600';
  if (type === 'moderator') return '#5e84f1';

  const nameEl = msgEl.querySelector('#author-name');
  if (nameEl) {
    const color = getComputedStyle(nameEl).color;
    if (color && !isNeutralColor(color)) return color;
  }
  return colorFromName(username);
}

function getYouTubeProfileUrl(msgEl) {
  const anchor = msgEl.querySelector('a[href*="/channel/"], a[href*="/@"], a[href*="youtube.com/"]');
  const href = anchor?.getAttribute('href');
  if (href && !href.startsWith('javascript:')) {
    try {
      const url = new URL(href, 'https://www.youtube.com');
      if (url.protocol === 'https:' && /(^|\.)youtube\.com$/.test(url.hostname)) {
        return url.href;
      }
    } catch (_) {
      /* ignore */
    }
  }
  return null;
}

function isWatchPage() {
  if (document.documentElement.dataset.ydmPreview === 'true') return true;
  const path = location.pathname;
  return path === '/watch' || /^\/live\/[^/]+/.test(path);
}

function pageKey() {
  if (!isWatchPage()) return '';
  if (document.documentElement.dataset.ydmPreview === 'true') return 'preview';
  const videoId = new URLSearchParams(location.search).get('v');
  if (videoId) return videoId;
  const live = location.pathname.match(/^\/live\/([^/]+)/);
  return live ? live[1] : location.pathname;
}

async function copyTextToClipboard(text) {
  if (!text) return false;

  if (typeof GM_setClipboard === 'function') {
    try {
      GM_setClipboard(text, 'text');
      return true;
    } catch (_) {
      /* ignore */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

async function setChatInputText(text) {
  if (!text) return false;

  const doc = getChatDocument();
  const win = doc?.defaultView;
  const input = doc?.querySelector(SELECTORS.chatInput);
  if (!doc || !win || !input) {
    return copyTextToClipboard(text);
  }

  win.focus();
  input.focus();

  const selection = win.getSelection();
  const range = doc.createRange();
  range.selectNodeContents(input);
  selection?.removeAllRanges();
  selection?.addRange(range);

  let inserted = false;
  try {
    inserted = doc.execCommand('insertText', false, text);
  } catch (_) {
    inserted = false;
  }

  const current = (input.innerText || input.textContent || '').replace(/\u00a0/g, ' ').trim();
  if (!inserted || current !== text.trim()) {
    input.innerText = text;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
    }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const endRange = doc.createRange();
  endRange.selectNodeContents(input);
  endRange.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(endRange);
  return true;
}

class LaneManager {
  constructor() {
    this.lanes = [];
    this.laneHeight = 28;
  }

  reset(laneCount, laneHeight) {
    this.laneHeight = laneHeight;
    this.lanes = Array.from({ length: Math.max(1, laneCount) }, () => 0);
  }

  acquire(durationMs) {
    const now = Date.now();
    let bestLane = 0;
    let bestTime = Infinity;

    for (let i = 0; i < this.lanes.length; i++) {
      if (this.lanes[i] <= now) {
        this.lanes[i] = now + durationMs * 0.6;
        return i;
      }
      if (this.lanes[i] < bestTime) {
        bestTime = this.lanes[i];
        bestLane = i;
      }
    }

    this.lanes[bestLane] = now + durationMs * 0.6;
    return bestLane;
  }
}

const SPEECH_GAP_MS = 250;

let speechSpeaker = null;

class DanmakuSpeaker {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.queue = [];
    this.token = 0;
    this.busy = false;
    this.timer = null;
    this.supported = typeof window.speechSynthesis !== 'undefined';
    this.keepAlive = null;
    if (!this.supported) return;
    this.keepAlive = setInterval(() => {
      const synth = window.speechSynthesis;
      if (!synth?.speaking || synth.paused) return;
      synth.pause();
      synth.resume();
    }, 10000);
  }

  destroy() {
    clearInterval(this.keepAlive);
    this.keepAlive = null;
    this.cancel();
  }

  canAutoSpeak() {
    const settings = this.getSettings();
    return !!settings.speechEnabled && Number(settings.speechVolume) > 0;
  }

  rateFor(text, paced) {
    const settings = this.getSettings();
    const base = clamp(Number(settings.speechRate) || 100, 50, 200) / 100;
    const usePace = paced ?? !!settings.speechPace;
    if (!usePace) return base;
    const maxSeconds = clamp(Number(settings.speechMaxSeconds) || 4, 1, 15);
    const estimate = estimateSpeechSeconds(text, base);
    if (estimate <= maxSeconds) return base;
    return clamp(base * (estimate / maxSeconds), base, 10);
  }

  listVoices() {
    if (!this.supported) return [];
    return window.speechSynthesis.getVoices();
  }

  findVoice() {
    const voices = this.listVoices();
    if (!voices.length) return null;
    const settings = this.getSettings();
    if (settings.speechVoice) {
      const picked = voices.find((voice) => voice.voiceURI === settings.speechVoice || voice.name === settings.speechVoice);
      if (picked) return picked;
    }
    const lang = String(settings.speechLang || navigator.language || '').toLowerCase();
    const prefix = lang.slice(0, 2);
    return voices.find((voice) => voice.default && voice.lang.toLowerCase().startsWith(prefix))
      || voices.find((voice) => prefix && voice.lang.toLowerCase().startsWith(prefix))
      || voices.find((voice) => voice.default)
      || voices[0];
  }

  request(text) {
    if (!this.supported || document.hidden || !this.canAutoSpeak()) return;
    const spoken = prepareSpeechText(text);
    if (!spoken) return;
    this.queue.push(spoken);
    if (!this.busy) this.pump();
  }

  speakNow(text) {
    const spoken = prepareSpeechText(text);
    if (!spoken || !this.supported) return;
    if (this.busy && this.queue.length) this.queue.shift();
    this.token += 1;
    const token = this.token;
    clearTimeout(this.timer);
    this.busy = true;
    window.speechSynthesis.cancel();
    this.timer = setTimeout(() => {
      if (token !== this.token) return;
      this.play(spoken, this.rateFor(spoken), token, () => this.pump());
    }, 60);
  }

  preview(text, paced) {
    const spoken = limitSpeechRepeats(normalizeSpeechText(text));
    if (!spoken || !this.supported) return;
    this.token += 1;
    const token = this.token;
    clearTimeout(this.timer);
    this.busy = true;
    window.speechSynthesis.cancel();
    this.timer = setTimeout(() => {
      if (token !== this.token) return;
      this.play(spoken, this.rateFor(spoken, paced), token, () => this.pump());
    }, 60);
  }

  pump() {
    if (!this.supported || !this.canAutoSpeak()) {
      this.queue = [];
      this.busy = false;
      return;
    }
    const buffer = clamp(Number(this.getSettings().speechBuffer) || 5, 1, 25);
    if (this.queue.length > buffer) this.queue = this.queue.slice(-buffer);
    if (!this.queue.length) {
      this.busy = false;
      return;
    }
    const text = this.queue[0];
    const rate = this.rateFor(text);
    this.busy = true;
    this.token += 1;
    const token = this.token;
    this.play(text, rate, token, () => {
      if (this.queue[0] === text) this.queue.shift();
      this.timer = setTimeout(() => this.pump(), SPEECH_GAP_MS);
    });
  }

  play(text, rate, token, onDone) {
    if (token !== this.token || !this.supported) return;
    const settings = this.getSettings();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = clamp(Number(settings.speechVolume), 0, 100) / 100;
    utterance.pitch = clamp(Number(settings.speechPitch), 0, 200) / 100;
    utterance.rate = clamp(rate, 0.1, 10);
    const voice = this.findVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    let settled = false;
    const finish = (event) => {
      if (settled || token !== this.token) return;
      if (event?.type === 'error' && (event.error === 'interrupted' || event.error === 'canceled')) return;
      settled = true;
      onDone?.();
    };
    utterance.addEventListener('end', finish);
    utterance.addEventListener('error', finish);
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    this.token += 1;
    this.queue = [];
    this.busy = false;
    clearTimeout(this.timer);
    this.timer = null;
    if (this.supported) window.speechSynthesis.cancel();
  }
}

function normalizeSpeechText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function speechSourceText(message, parts) {
  if (Array.isArray(parts) && parts.length) {
    return parts
      .filter((part) => part?.type === 'text' && part.text)
      .map((part) => part.text)
      .join(' ');
  }
  return message || '';
}

function limitSpeechRepeats(text, maxRepeats = 3) {
  let out = String(text || '');
  const maxUnit = Math.floor(out.length / (maxRepeats + 1));
  for (let len = maxUnit; len >= 1; len -= 1) {
    const pattern = new RegExp(`([\\s\\S]{${len}})\\1{${maxRepeats},}`, 'g');
    out = out.replace(pattern, (_match, unit) => unit.repeat(maxRepeats));
  }
  return out.replace(/(\S+)(?:\s+\1){3,}/g, (_match, token) => Array(maxRepeats).fill(token).join(' '));
}

function hasReadableSpeech(text) {
  const stripped = String(text || '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\p{N}/gu, '')
    .replace(/\p{P}/gu, '')
    .replace(/\p{S}/gu, '')
    .replace(/\s+/g, '');
  return stripped.length > 0;
}

function prepareSpeechText(text) {
  const spoken = limitSpeechRepeats(normalizeSpeechText(text));
  return hasReadableSpeech(spoken) ? spoken : '';
}

function estimateSpeechSeconds(text, rate) {
  let units = 0;
  for (const ch of String(text || '')) {
    if (/\s/.test(ch)) continue;
    units += /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(ch) ? 1 : 0.45;
  }
  return (units * 0.24) / (rate || 1);
}

function ensureSpeechSpeaker(getSettings) {
  if (!speechSpeaker) speechSpeaker = new DanmakuSpeaker(getSettings);
  return speechSpeaker;
}

function requestSpeech(text) {
  speechSpeaker?.request(text);
}

function speakTextNow(text) {
  speechSpeaker?.speakNow(text);
}

function previewSpeech(text, fast) {
  speechSpeaker?.preview(text, fast);
}

function cancelSpeech() {
  speechSpeaker?.cancel();
}

function listSpeechVoices() {
  return speechSpeaker?.listVoices() || [];
}

function speechSupported() {
  return !!speechSpeaker?.supported;
}

function appendDanmakuContent(item, message, parts) {
  if (!Array.isArray(parts) || !parts.length) {
    item.textContent = message || '';
    return;
  }

  for (const part of parts) {
    if (part?.type === 'emote') {
      const src = safeEmoteSrc(part.src);
      if (!src) {
        if (part.alt) item.appendChild(document.createTextNode(part.alt));
        continue;
      }
      const slot = document.createElement('span');
      slot.className = 'ydm-emote';
      slot.style.display = 'inline-block';
      slot.style.width = '1.15em';
      slot.style.height = '1.15em';
      const img = document.createElement('img');
      img.alt = part.alt || '';
      img.src = src;
      img.draggable = false;
      img.referrerPolicy = 'no-referrer';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.fontSize = '0';
      slot.appendChild(img);
      item.appendChild(slot);
      continue;
    }
    if (part?.text) item.appendChild(document.createTextNode(part.text));
  }

  if (!item.childNodes.length) item.textContent = message || '';
}

class DanmakuEngine {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.laneManager = new LaneManager();
    this.layer = null;
    this.superchatLayer = null;
    this.pinnedItem = null;
    this.superchatQueue = [];
    this.playerEl = null;
    this.overlayEl = null;
    this.resizeObserver = null;
    this.controlsObserver = null;
    this.controlsHeight = SCROLL_AREA_BOTTOM_RESERVE;
    this.boundUpdate = () => this.updateLayout();
  }

  insertLayer() {
    const overlay = this.overlayEl || this.playerEl;
    overlay.appendChild(this.layer);
    if (this.superchatLayer) overlay.appendChild(this.superchatLayer);
  }

  async mount() {
    this.playerEl = await waitForElement(SELECTORS.player);
    if (!this.playerEl) {
      console.warn('[YDM] Video player not found');
      return;
    }

    this.overlayEl = this.playerEl.querySelector('.html5-video-container') || this.playerEl;
    if (getComputedStyle(this.overlayEl).position === 'static') {
      this.overlayEl.style.position = 'relative';
    }

    this.layer = document.createElement('div');
    this.layer.className = 'ydm-danmaku-layer';
    this.layer.setAttribute('aria-hidden', 'true');
    this.superchatLayer = document.createElement('div');
    this.superchatLayer.className = 'ydm-superchat-layer';
    this.superchatLayer.setAttribute('aria-hidden', 'true');
    this.insertLayer();

    this.resizeObserver = new ResizeObserver(this.boundUpdate);
    this.resizeObserver.observe(this.playerEl);

    const chrome = this.playerEl.querySelector(SELECTORS.playerChrome);
    if (chrome) {
      this.controlsObserver = new ResizeObserver(this.boundUpdate);
      this.controlsObserver.observe(chrome);
    }

    window.addEventListener('resize', this.boundUpdate);
    document.addEventListener('fullscreenchange', this.boundUpdate);
    document.addEventListener('webkitfullscreenchange', this.boundUpdate);
    this.updateLayout();
  }

  destroy() {
    window.removeEventListener('resize', this.boundUpdate);
    document.removeEventListener('fullscreenchange', this.boundUpdate);
    document.removeEventListener('webkitfullscreenchange', this.boundUpdate);
    this.resizeObserver?.disconnect();
    this.controlsObserver?.disconnect();
    hideDanmakuTooltip();
    this.layer?.remove();
    this.superchatLayer?.remove();
    this.layer = null;
    this.superchatLayer = null;
    this.pinnedItem = null;
    this.superchatQueue = [];
    this.playerEl = null;
    this.overlayEl = null;
  }

  getLaneHeight() {
    return this.getSettings().fontSize + 8;
  }

  getItemOpacity() {
    return clamp(this.getSettings().opacity ?? 100, 10, 100) / 100;
  }

  getBottomReserve() {
    const player = this.playerEl;
    const controls = player?.querySelector(SELECTORS.playerChrome);
    const autohide = player?.classList.contains('ytp-autohide');
    if (controls && !autohide) {
      const height = controls.getBoundingClientRect().height;
      if (height > 8) this.controlsHeight = Math.ceil(height) + 4;
    }
    return this.controlsHeight;
  }

  getPinnedBandHeight() {
    return this.getLaneHeight() + 18;
  }

  getPinnedBandRect(playerHeight) {
    if (!this.pinnedItem || !this.getSettings().superchatPinned) return null;
    const band = this.getPinnedBandHeight();
    const pos = this.getSettings().superchatPosition === 'bottom' ? 'bottom' : 'top';
    const top = pos === 'bottom'
      ? Math.max(0, playerHeight - this.getBottomReserve() - band)
      : 8;
    return { pos, top, height: band };
  }

  getScrollAreaRect(playerRect) {
    const laneHeight = this.getLaneHeight();
    const h = playerRect.height;
    let area;

    switch (this.getSettings().scrollArea) {
      case 'top-half':
        area = { top: 0, height: Math.max(laneHeight, h * 0.5) };
        break;
      case 'top-quarter':
        area = { top: 0, height: Math.max(laneHeight, h * 0.25) };
        break;
      default:
        area = { top: 0, height: Math.max(laneHeight, h - this.getBottomReserve()) };
        break;
    }

    const band = this.getPinnedBandRect(h);
    if (!band) return area;
    const areaBottom = area.top + area.height;
    const bandBottom = band.top + band.height;
    if (bandBottom <= area.top || band.top >= areaBottom) return area;
    if (band.pos === 'top') {
      const nextTop = Math.max(area.top, bandBottom + 4);
      return { top: nextTop, height: Math.max(laneHeight, areaBottom - nextTop) };
    }
    const nextBottom = Math.min(areaBottom, band.top - 4);
    return { top: area.top, height: Math.max(laneHeight, nextBottom - area.top) };
  }

  migrateDanmakuItems(items, oldRect, newWidth, newHeight) {
    const oldWidth = oldRect.width || 1;
    const oldHeight = oldRect.height || 1;

    for (const item of items) {
      if (!item.isConnected) continue;

      const top = parseFloat(item.style.top) || 0;
      item.style.top = `${(top / oldHeight) * newHeight}px`;

      const oldTravel = parseFloat(item.style.getPropertyValue('--ydm-travel')) || oldWidth;
      const oldDuration = parseFloat(item.style.getPropertyValue('--ydm-duration')) || 8000;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(item).transform);
      const progress = oldTravel > 0 ? clamp(-matrix.m41 / oldTravel, 0, 1) : 0;

      const itemWidth = item.offsetWidth;
      const newTravel = newWidth + itemWidth;
      const newDuration = (newTravel / oldTravel) * oldDuration;
      const remaining = Math.max(0, newDuration * (1 - progress));

      item._ydmClearRemoveTimer?.();

      const wasPaused = item.classList.contains('ydm-paused');
      if (wasPaused) item.classList.remove('ydm-paused');

      item.style.setProperty('--ydm-travel', `${newTravel}px`);
      item.style.setProperty('--ydm-start', `${-progress * newTravel}px`);
      item.style.setProperty('--ydm-duration', `${remaining}ms`);
      item.style.animation = 'none';
      void item.offsetWidth;
      item.style.animation = '';

      if (wasPaused) item.classList.add('ydm-paused');
      item._ydmScheduleRemove?.(remaining);
    }
  }

  updateLayout() {
    if (!this.layer || !this.playerEl) return;

    const settings = this.getSettings();
    if (!settings.superchatPinned || !settings.enabled) {
      this.superchatQueue = [];
      this.pinnedItem?.remove();
      this.pinnedItem = null;
    }

    const rect = this.playerEl.getBoundingClientRect();
    const area = this.getScrollAreaRect(rect);
    const oldRect = this.layer.getBoundingClientRect();
    const items = [...this.layer.querySelectorAll('.ydm-danmaku-item')];
    const shouldMigrate = items.length > 0;

    if (shouldMigrate) hideDanmakuTooltip();
    if (this.layer.parentElement !== this.overlayEl) this.insertLayer();

    Object.assign(this.layer.style, {
      position: 'absolute',
      top: `${area.top}px`,
      left: '0',
      width: '100%',
      height: `${area.height}px`,
      zIndex: '2',
    });

    const newWidth = this.layer.clientWidth;
    const newHeight = this.layer.clientHeight;
    if (shouldMigrate && (
      Math.abs(oldRect.width - newWidth) > 1
      || Math.abs(oldRect.height - newHeight) > 1
    )) {
      this.migrateDanmakuItems(items, oldRect, newWidth, newHeight);
    }

    const laneHeight = this.getLaneHeight();
    this.laneManager.reset(Math.floor(newHeight / laneHeight), laneHeight);
    this.layer.style.display = this.getSettings().enabled ? 'block' : 'none';
    this.layoutSuperchat(rect);

    const opacity = this.getItemOpacity();
    for (const item of items) {
      if (item.isConnected) item.style.opacity = String(opacity);
    }
  }

  layoutSuperchat(playerRect) {
    if (!this.superchatLayer) return;
    const band = this.getPinnedBandRect(playerRect.height);
    if (!band) {
      this.superchatLayer.style.display = 'none';
      return;
    }
    this.superchatLayer.classList.toggle('ydm-sc-bottom', band.pos === 'bottom');
    Object.assign(this.superchatLayer.style, {
      display: 'flex',
      position: 'absolute',
      top: `${band.top}px`,
      left: '0',
      width: '100%',
      height: `${band.height}px`,
      zIndex: '4',
    });
  }

  render(payload) {
    const settings = this.getSettings();
    if (payload.superchat && settings.superchatPinned) {
      this.queueSuperchat(payload);
      return;
    }
    this.renderScrolling(payload);
  }

  queueSuperchat(payload) {
    if (!this.superchatLayer || !this.getSettings().enabled) return;
    if (this.pinnedItem) {
      this.superchatQueue.push(payload);
      if (this.superchatQueue.length > 6) this.superchatQueue.shift();
      return;
    }
    this.mountSuperchat(payload);
  }

  mountSuperchat({ username, message, parts, usernameColor, profileUrl, originalMessage, translated, superchatStyle }) {
    const settings = this.getSettings();
    const hasEmote = Array.isArray(parts) && parts.some((part) => part.type === 'emote' && part.src);
    if (!this.superchatLayer || (!message && !hasEmote)) return;

    const animation = ['fade', 'slide', 'pop', 'shine'].includes(settings.superchatAnimation)
      ? settings.superchatAnimation
      : 'slide';
    const duration = clamp(Number(settings.superchatDuration) || 6, 2, 15);
    const item = document.createElement('div');
    item.className = `ydm-superchat-item ydm-sc-${animation}`;
    item.style.setProperty('--ydm-sc-duration', `${duration}s`);
    item.style.background = safeCssColor(superchatStyle?.background || '#e53935');
    item.style.color = safeCssColor(superchatStyle?.color || '#ffffff');
    item.style.fontSize = `${settings.fontSize}px`;
    item.style.fontFamily = settings.fontFamily;
    appendDanmakuContent(item, message, parts);
    this.superchatLayer.appendChild(item);
    this.pinnedItem = item;
    this.updateLayout();
    requestSpeech(speechSourceText(message, parts));

    let fallback = null;
    const armFallback = (ms) => {
      clearTimeout(fallback);
      fallback = setTimeout(() => this.finishSuperchat(item), ms);
    };
    armFallback((duration + 2) * 1000);
    item.addEventListener('animationend', (event) => {
      if (event.target !== item || event.animationName === 'ydm-sc-shine-sweep') return;
      clearTimeout(fallback);
      this.finishSuperchat(item);
    });

    attachDanmakuInteraction(item, {
      username,
      usernameColor,
      profileUrl,
      originalMessage,
      translated,
      onPause: () => clearTimeout(fallback),
      onResume: () => armFallback(20000),
    });
  }

  finishSuperchat(item) {
    if (!item || (!item.isConnected && this.pinnedItem !== item)) return;
    if (this.pinnedItem === item) this.pinnedItem = null;
    item.remove();
    const next = this.superchatQueue.shift();
    if (next && this.getSettings().superchatPinned && this.getSettings().enabled) {
      this.mountSuperchat(next);
      return;
    }
    this.updateLayout();
  }

  renderScrolling({ username, message, parts, usernameColor, profileUrl, originalMessage, translated }) {
    const settings = this.getSettings();
    const hasEmote = Array.isArray(parts) && parts.some((part) => part.type === 'emote' && part.src);
    if (!settings.enabled || !this.layer || (!message && !hasEmote)) return;

    const layerWidth = this.layer.clientWidth || 800;
    const speed = clamp(settings.speed, 1, 10);
    const baseDuration = 30000;
    const laneHeight = this.getLaneHeight();

    const item = document.createElement('div');
    item.className = 'ydm-danmaku-item';
    appendDanmakuContent(item, message, parts);
    item.style.top = '0';
    item.style.color = safeCssColor(usernameColor);
    item.style.fontSize = `${settings.fontSize}px`;
    item.style.fontFamily = settings.fontFamily;
    item.style.opacity = String(this.getItemOpacity());
    item.style.visibility = 'hidden';
    item.style.animation = 'none';

    this.layer.appendChild(item);
    const itemWidth = item.offsetWidth;
    const travel = layerWidth + itemWidth;
    const durationMs = Math.round((travel / layerWidth) * (baseDuration / speed));
    const lane = this.laneManager.acquire(durationMs);

    item.style.top = `${lane * laneHeight}px`;
    item.style.visibility = '';
    item.style.setProperty('--ydm-travel', `${travel}px`);
    item.style.setProperty('--ydm-start', '0px');
    item.style.setProperty('--ydm-duration', `${durationMs}ms`);
    void item.offsetWidth;
    item.style.animation = '';

    const startAt = Date.now();
    let pausedAt = 0;
    let totalPaused = 0;
    let removeTimer = null;

    const scheduleRemove = (remainingMs = durationMs) => {
      const elapsed = Date.now() - startAt - totalPaused;
      const remaining = remainingMs ?? Math.max(0, durationMs - elapsed);
      clearTimeout(removeTimer);
      removeTimer = setTimeout(() => item.remove(), remaining + 500);
    };

    item._ydmClearRemoveTimer = () => clearTimeout(removeTimer);
    item._ydmScheduleRemove = scheduleRemove;

    const onPause = () => {
      pausedAt = Date.now();
      clearTimeout(removeTimer);
    };

    const onResume = () => {
      if (pausedAt) {
        totalPaused += Date.now() - pausedAt;
        pausedAt = 0;
      }
      scheduleRemove();
    };

    requestSpeech(speechSourceText(message, parts));

    attachDanmakuInteraction(item, {
      username,
      usernameColor,
      profileUrl,
      originalMessage,
      translated,
      onPause,
      onResume,
    });
    scheduleRemove();

    item.addEventListener('animationend', () => {
      clearTimeout(removeTimer);
      item.remove();
    }, { once: true });
  }
}

const MAX_DANMAKU_PAUSE_MS = 15000;
const RESUME_DELAY_MS = 300;

let activeTooltip = null;
let activeTooltipItem = null;
let hoverPausedItem = null;
let clickLockBackdrop = null;
let tooltipRepositionHandler = null;
let tooltipDismissBound = false;

function removeClickLockBackdrop() {
  clickLockBackdrop?.remove();
  clickLockBackdrop = null;
}

function showClickLockBackdrop(mount) {
  removeClickLockBackdrop();
  if (!mount) return;

  if (getComputedStyle(mount).position === 'static') {
    mount.style.position = 'relative';
  }

  clickLockBackdrop = document.createElement('div');
  clickLockBackdrop.className = 'ydm-click-lock-backdrop';
  clickLockBackdrop.addEventListener('pointerdown', (e) => {
    const otherDanmaku = document.elementsFromPoint(e.clientX, e.clientY)
      .find((el) => (el.classList?.contains('ydm-danmaku-item') || el.classList?.contains('ydm-superchat-item')) && el !== activeTooltipItem);

    hideDanmakuTooltip();

    if (otherDanmaku) {
      requestAnimationFrame(() => {
        otherDanmaku.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
    }
  }, true);

  mount.appendChild(clickLockBackdrop);
}

function hideDanmakuTooltip() {
  if (tooltipRepositionHandler) {
    window.removeEventListener('resize', tooltipRepositionHandler);
    window.removeEventListener('scroll', tooltipRepositionHandler, true);
    document.removeEventListener('fullscreenchange', tooltipRepositionHandler);
    document.removeEventListener('webkitfullscreenchange', tooltipRepositionHandler);
    tooltipRepositionHandler = null;
  }

  removeClickLockBackdrop();

  const resumeFn = activeTooltipItem?._ydmResume;
  activeTooltipItem?.classList.remove('ydm-click-locked');
  activeTooltip?.remove();
  activeTooltip = null;
  activeTooltipItem = null;
  resumeFn?.();
}

function ensureTooltipDismissListener() {
  if (tooltipDismissBound) return;
  tooltipDismissBound = true;
  document.addEventListener('pointerdown', (e) => {
    if (!activeTooltip) return;
    if (activeTooltip.contains(e.target)) return;
    if (e.target.closest?.('.ydm-danmaku-item, .ydm-superchat-item') === activeTooltipItem) return;
    if (clickLockBackdrop?.contains(e.target)) return;
    hideDanmakuTooltip();
  }, true);
}

function getVideoBounds() {
  const player = getPlayerElement();
  const video = player?.querySelector('video.html5-main-video') || player;
  const rect = video?.getBoundingClientRect();
  if (!rect || rect.width < 16 || rect.height < 16) return null;
  return rect;
}

function getTooltipHost() {
  return getFullscreenElement() || document.body;
}

function positionDanmakuTooltip(item, tooltip) {
  const bounds = getVideoBounds();
  if (!bounds) return;

  const host = getTooltipHost();
  if (tooltip.parentElement !== host) host.appendChild(tooltip);

  const margin = 8;
  const gap = 6;
  tooltip.style.position = 'fixed';
  tooltip.style.zIndex = '2147483646';
  tooltip.style.maxWidth = `${Math.max(96, bounds.width - margin * 2)}px`;
  tooltip.style.maxHeight = `${Math.max(32, bounds.height - margin * 2)}px`;

  const itemRect = item.getBoundingClientRect();
  const tipHeight = tooltip.offsetHeight;
  const tipWidth = tooltip.offsetWidth;
  const spaceAbove = itemRect.top - bounds.top - margin;
  const spaceBelow = bounds.bottom - itemRect.bottom - margin;
  const needed = tipHeight + gap;
  const placement = spaceAbove >= needed && (spaceBelow < needed || spaceAbove >= spaceBelow)
    ? 'above'
    : 'below';

  tooltip.classList.toggle('ydm-danmaku-tooltip--above', placement === 'above');
  tooltip.classList.toggle('ydm-danmaku-tooltip--below', placement === 'below');

  let left = itemRect.left + itemRect.width / 2 - tipWidth / 2;
  let top = placement === 'below'
    ? itemRect.bottom + gap
    : itemRect.top - tipHeight - gap;

  const minLeft = bounds.left + margin;
  const maxLeft = bounds.right - tipWidth - margin;
  const minTop = bounds.top + margin;
  const maxTop = bounds.bottom - tipHeight - margin;
  left = clamp(left, minLeft, Math.max(minLeft, maxLeft));
  top = clamp(top, minTop, Math.max(minTop, maxTop));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function bindTooltipReposition(item, tooltip) {
  tooltipRepositionHandler = () => positionDanmakuTooltip(item, tooltip);
  window.addEventListener('resize', tooltipRepositionHandler);
  window.addEventListener('scroll', tooltipRepositionHandler, true);
  document.addEventListener('fullscreenchange', tooltipRepositionHandler);
  document.addEventListener('webkitfullscreenchange', tooltipRepositionHandler);
}

function attachDanmakuInteraction(item, {
  username, usernameColor, profileUrl, originalMessage, translated, onPause, onResume,
}) {
  let hoverResumeTimer = null;
  let maxPauseTimer = null;
  let pauseReason = null;

  const clearHoverResumeTimer = () => {
    clearTimeout(hoverResumeTimer);
    hoverResumeTimer = null;
  };

  const clearMaxPauseTimer = () => {
    clearTimeout(maxPauseTimer);
    maxPauseTimer = null;
  };

  const armMaxPauseTimer = () => {
    clearMaxPauseTimer();
    maxPauseTimer = setTimeout(() => {
      if (item.classList.contains('ydm-paused')) doResume();
    }, MAX_DANMAKU_PAUSE_MS);
  };

  const doResume = () => {
    clearHoverResumeTimer();
    clearMaxPauseTimer();
    if (!item.classList.contains('ydm-paused')) {
      pauseReason = null;
      item.classList.remove('ydm-click-locked');
      return;
    }

    pauseReason = null;
    item.classList.remove('ydm-paused', 'ydm-click-locked');
    if (hoverPausedItem === item) hoverPausedItem = null;
    if (activeTooltipItem === item) {
      removeClickLockBackdrop();
      activeTooltip?.remove();
      activeTooltip = null;
      activeTooltipItem = null;
    }
    onResume?.();
  };

  item._ydmResume = () => doResume();
  item._ydmResumeHover = () => {
    if (pauseReason !== 'hover') return;
    doResume();
  };

  const scheduleHoverResume = () => {
    if (pauseReason === 'click') return;
    clearHoverResumeTimer();
    hoverResumeTimer = setTimeout(() => {
      if (pauseReason === 'hover') doResume();
    }, RESUME_DELAY_MS);
  };

  const pauseForHover = () => {
    if (activeTooltipItem) return;
    if (pauseReason === 'click') return;

    clearHoverResumeTimer();
    if (hoverPausedItem && hoverPausedItem !== item) {
      hoverPausedItem._ydmResumeHover?.();
    }
    hoverPausedItem = item;

    if (!item.classList.contains('ydm-paused')) {
      pauseReason = 'hover';
      item.classList.add('ydm-paused');
      onPause?.();
    } else if (pauseReason !== 'hover') {
      pauseReason = 'hover';
    }

    armMaxPauseTimer();
  };

  const pauseForClick = () => {
    clearHoverResumeTimer();
    if (hoverPausedItem && hoverPausedItem !== item) {
      hoverPausedItem._ydmResumeHover?.();
    }
    hoverPausedItem = null;

    pauseReason = 'click';
    item.classList.add('ydm-click-locked');
    if (!item.classList.contains('ydm-paused')) {
      item.classList.add('ydm-paused');
      onPause?.();
    }
    armMaxPauseTimer();
  };

  const showTooltip = () => {
    const messageText = originalMessage || item.textContent;
    const showOriginal = translated && originalMessage && originalMessage !== item.textContent;
    if (!username && !showOriginal && !messageText) return;

    ensureTooltipDismissListener();
    hideDanmakuTooltip();
    pauseForClick();

    item.dataset.ydmId = item.dataset.ydmId || String(Date.now() + Math.random());
    const mount = getDanmakuMount(item);
    if (!mount) {
      doResume();
      return;
    }

    showClickLockBackdrop(mount);

    const tooltip = document.createElement('div');
    tooltip.className = 'ydm-danmaku-tooltip ydm-danmaku-tooltip--above';
    tooltip.dataset.itemId = item.dataset.ydmId;

    const bubble = document.createElement('div');
    bubble.className = 'ydm-danmaku-tooltip-bubble';

    const header = document.createElement('div');
    header.className = 'ydm-danmaku-tooltip-header';

    if (username) {
      const nameRow = document.createElement(profileUrl ? 'a' : 'span');
      nameRow.className = 'ydm-danmaku-tooltip-name';
      nameRow.textContent = username;
      nameRow.style.color = safeCssColor(usernameColor || '#ff4e45');
      if (profileUrl) {
        nameRow.href = profileUrl;
        nameRow.target = '_blank';
        nameRow.rel = 'noopener noreferrer';
        nameRow.setAttribute('aria-label', t('tooltipOpenProfile'));
        nameRow.addEventListener('click', (e) => e.stopPropagation());
      }
      header.appendChild(nameRow);
    } else {
      header.classList.add('ydm-danmaku-tooltip-header--solo');
    }

    const actions = document.createElement('div');
    actions.className = 'ydm-danmaku-tooltip-actions';

    const spokenText = (item.textContent || messageText || '').trim();
    if (spokenText) {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'ydm-danmaku-tooltip-speak';
      speakBtn.setAttribute('aria-label', t('tooltipSpeak'));
      appendMarkup(speakBtn, ICON_SPEECH_ON);
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        speakTextNow(spokenText);
      });
      actions.appendChild(speakBtn);
    }

    if (messageText) {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'ydm-danmaku-tooltip-copy';
      copyBtn.setAttribute('aria-label', t('tooltipCopy'));
      appendMarkup(copyBtn, ICON_COPY);
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await Promise.all([
          setChatInputText(messageText),
          copyTextToClipboard(messageText),
        ]);
        hideDanmakuTooltip();
      });
      actions.appendChild(copyBtn);
    }

    if (actions.childElementCount) header.appendChild(actions);

    bubble.appendChild(header);

    if (showOriginal) {
      const originalRow = document.createElement('div');
      originalRow.className = 'ydm-danmaku-tooltip-original';
      originalRow.textContent = truncateText(originalMessage);
      bubble.appendChild(originalRow);
    }

    const tail = document.createElement('div');
    tail.className = 'ydm-danmaku-tooltip-tail';
    tooltip.append(bubble, tail);
    tooltip.addEventListener('click', (e) => e.stopPropagation());
    tooltip.addEventListener('pointerdown', (e) => e.stopPropagation());

    getTooltipHost().appendChild(tooltip);
    positionDanmakuTooltip(item, tooltip);
    bindTooltipReposition(item, tooltip);
    activeTooltip = tooltip;
    activeTooltipItem = item;

    requestAnimationFrame(() => {
      if (activeTooltip === tooltip) positionDanmakuTooltip(item, tooltip);
    });
  };

  item.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
  });

  item.addEventListener('mouseenter', () => {
    pauseForHover();
  });

  item.addEventListener('mouseleave', () => {
    if (pauseReason === 'click') return;
    scheduleHoverResume();
  });

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showTooltip();
  });

  item.addEventListener('animationend', () => {
    clearHoverResumeTimer();
    clearMaxPauseTimer();
    if (activeTooltipItem === item) hideDanmakuTooltip();
  }, { once: true });
}

class DanmakuEmitter {
  constructor(engine, getSettings, isActive) {
    this.engine = engine;
    this.getSettings = getSettings;
    this.isActive = isActive;
    this.queue = [];
    this.timer = null;
  }

  enqueue(payload) {
    if (!this.isActive()) return;

    if (this.queue.length >= MAX_DANMAKU_QUEUE) {
      this.queue.shift();
    }
    this.queue.push(payload);
    this.schedule();
  }

  clear() {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  schedule() {
    if (this.timer || !this.isActive()) return;

    const speed = clamp(this.getSettings().speed, 1, 10);
    const intervalMs = Math.max(120, Math.round(550 / speed));

    this.timer = setTimeout(() => {
      this.timer = null;
      const item = this.queue.shift();
      if (item) this.engine.render(item);
      if (this.queue.length && this.isActive()) this.schedule();
    }, intervalMs);
  }
}

function dictEntry(zhCN, zhTW, en) {
  return { 'zh-CN': zhCN, 'zh-TW': zhTW, en };
}

// Case-sensitive keys — emotes and slang must match exact casing.
const TWITCH_DICTIONARY = {
  PogChamp: dictEntry('（神操作）', '（神操作）', 'PogChamp'),
  PepeHands: dictEntry('（哭哭）', '（哭哭）', 'PepeHands'),
  OMEGALUL: dictEntry('（笑死）', '（笑死）', 'OMEGALUL'),
  PepeLaugh: dictEntry('（大笑）', '（大笑）', 'PepeLaugh'),
  PauseChamp: dictEntry('（等等）', '（等等）', 'PauseChamp'),
  monkaS: dictEntry('（紧张）', '（緊張）', 'monkaS'),
  monkaW: dictEntry('（紧张）', '（緊張）', 'monkaW'),
  KEKW: dictEntry('（爆笑）', '（爆笑）', 'KEKW'),
  LULW: dictEntry('（笑）', '（笑）', 'LULW'),
  LUL: dictEntry('（笑）', '（笑）', 'LUL'),
  Sadge: dictEntry('（难受）', '（難受）', 'Sadge'),
  Pepega: dictEntry('（有点蠢）', '（有點蠢）', 'Pepega'),
  Kappa: dictEntry('（反讽）', '（反諷）', 'Kappa'),
  Copium: dictEntry('自我安慰', '自我安慰', 'Copium'),
  Hopium: dictEntry('抱有幻想', '抱有幻想', 'Hopium'),
  Based: dictEntry('真敢说', '真敢說', 'Based'),
  Cringe: dictEntry('尴尬', '尷尬', 'Cringe'),
  PogU: dictEntry('（太神了）', '（太神了）', 'PogU'),
  Pog: dictEntry('（太神了）', '（太神了）', 'Pog'),
  EZ: dictEntry('轻松', '輕鬆', 'EZ'),
  Clap: dictEntry('（鼓掌）', '（鼓掌）', 'Clap'),
  NPC: dictEntry('工具人', '工具人', 'NPC'),
  ICANT: dictEntry('我做不到', '我做不到', 'ICANT'),
  W: dictEntry('神', '神', 'W'),
  L: dictEntry('拉胯', '拉胯', 'L'),
  F: dictEntry('F', 'F', 'F'),
  o7: dictEntry('o7', 'o7', 'o7'),
  lol: dictEntry('哈哈', '哈哈', 'lol'),
  lmao: dictEntry('笑死我了', '笑死我了', 'lmao'),
  lmfao: dictEntry('笑死我了', '笑死我了', 'lmfao'),
  rofl: dictEntry('笑翻', '笑翻', 'rofl'),
  kek: dictEntry('笑', '笑', 'kek'),
  gg: dictEntry('GG', 'GG', 'gg'),
  ggs: dictEntry('GG', 'GG', 'ggs'),
  wp: dictEntry('打得不错', '打得不错', 'wp'),
  gl: dictEntry('祝好运', '祝好運', 'gl'),
  hf: dictEntry('玩得开心', '玩得開心', 'hf'),
  nt: dictEntry('好尝试', '好嘗試', 'nt'),
  ns: dictEntry('好枪', '好槍', 'ns'),
  brb: dictEntry('马上回来', '馬上回來', 'brb'),
  afk: dictEntry('离开了', '離開了', 'afk'),
  bbl: dictEntry('待会儿回来', '待會兒回來', 'bbl'),
  gtg: dictEntry('得走了', '得走了', 'gtg'),
  ty: dictEntry('谢谢', '謝謝', 'ty'),
  thx: dictEntry('谢谢', '謝謝', 'thx'),
  np: dictEntry('不客气', '不客氣', 'np'),
  nw: dictEntry('不客气', '不客氣', 'nw'),
  imo: dictEntry('我觉得', '我覺得', 'imo'),
  imho: dictEntry('依我看', '依我看', 'imho'),
  tbh: dictEntry('老实说', '老實說', 'tbh'),
  ngl: dictEntry('说实话', '說實話', 'ngl'),
  rn: dictEntry('现在', '現在', 'rn'),
  idk: dictEntry('不知道', '不知道', 'idk'),
  ikr: dictEntry('确实', '確實', 'ikr'),
  smh: dictEntry('无语', '無語', 'smh'),
  omg: dictEntry('天呐', '天呐', 'omg'),
  omfg: dictEntry('我的天', '我的天', 'omfg'),
  wtf: dictEntry('什么鬼', '什麼鬼', 'wtf'),
  rip: dictEntry('RIP', 'RIP', 'rip'),
  ez: dictEntry('轻松', '輕鬆', 'ez'),
  diff: dictEntry('差距', '差距', 'diff'),
};

const PLACEHOLDER_PREFIX = '⟦T';
const PLACEHOLDER_SUFFIX = '⟧';

let dictionaryPattern = null;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDictionaryPattern() {
  if (dictionaryPattern) return dictionaryPattern;

  const keys = Object.keys(TWITCH_DICTIONARY).sort((a, b) => b.length - a.length);
  const body = keys.map(escapeRegExp).join('|');
  dictionaryPattern = new RegExp(`(?<![\\w])(${body})(?![\\w])`, 'g');
  return dictionaryPattern;
}

function lookupDictionary(term, targetLang) {
  const entry = TWITCH_DICTIONARY[term];
  if (!entry) return null;
  return entry[targetLang] || entry.en || term;
}

function collectDictionaryMatches(text) {
  const pattern = getDictionaryPattern();
  const matches = [];
  let match;

  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      term: match[1],
    });
  }

  if (matches.length === 0) return [];

  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const selected = [];
  let cursor = 0;
  for (const item of matches) {
    if (item.start < cursor) continue;
    selected.push(item);
    cursor = item.end;
  }
  return selected;
}

function prepareDictionaryText(text, targetLang) {
  const matches = collectDictionaryMatches(text);
  if (matches.length === 0) {
    return { preparedText: text, placeholders: [], fullyMapped: false };
  }

  const placeholders = [];
  let preparedText = '';
  let cursor = 0;

  for (let i = 0; i < matches.length; i += 1) {
    const { start, end, term } = matches[i];
    preparedText += text.slice(cursor, start);

    const token = `${PLACEHOLDER_PREFIX}${i}${PLACEHOLDER_SUFFIX}`;
    const replacement = lookupDictionary(term, targetLang) || term;
    placeholders.push({ token, replacement });
    preparedText += token;
    cursor = end;
  }

  preparedText += text.slice(cursor);

  const withoutPlaceholders = preparedText.replace(
    new RegExp(`${escapeRegExp(PLACEHOLDER_PREFIX)}\\d+${escapeRegExp(PLACEHOLDER_SUFFIX)}`, 'g'),
    '',
  );

  const fullyMapped = matches.length > 0 && !withoutPlaceholders.trim();

  return { preparedText, placeholders, fullyMapped };
}

function restoreDictionaryText(text, placeholders) {
  if (!text || placeholders.length === 0) return text;

  let restored = text;
  for (const { token, replacement } of placeholders) {
    restored = restored.split(token).join(replacement);
  }
  return restored;
}

const MS_LANG_MAP = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ru: 'ru',
  pt: 'pt',
};

const TENCENT_LANG_MAP = {
  'zh-CN': 'zh',
  'zh-TW': 'zh-TW',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ru: 'ru',
  pt: 'pt',
};

const TRANSLATE_TIMEOUT_MS = 8000;
const TRANSLATE_MAX_BATCH = 10;
const TRANSLATE_MAX_BATCH_CHARS = 1600;
const PROVIDER_GAP_MS = 1000;
const PRIMARY_PROVIDERS = ['microsoft', 'google'];
const ALL_PROVIDERS = ['microsoft', 'google', 'volcengine', 'caiyun', 'tencent'];
const MAX_PROVIDER_ATTEMPTS = 2;
const HARD_COOLDOWNS_MS = [5000, 15000, 40000, 60000];
const SOFT_COOLDOWNS_MS = [2000, 5000, 15000, 30000];
const TRANSLATION_CACHE_LIMIT = 200;
const TRANSLATION_CACHE_TTL_MS = 10 * 60 * 1000;

const VOLC_LANG_MAP = {
  'zh-CN': 'zh',
  'zh-TW': 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ru: 'ru',
  pt: 'pt',
};

const CAIYUN_LANG_MAP = {
  'zh-CN': 'auto2zh',
  'zh-TW': 'auto2zh-Hant',
  en: 'auto2en',
  ja: 'auto2ja',
  ko: 'auto2ko',
  es: 'auto2es',
  fr: 'auto2fr',
  de: 'auto2de',
  ru: 'auto2ru',
  pt: 'auto2pt',
};

const CAIYUN_TOKEN = '3975l6lr5pcbvidl6jl2';

const translationCache = new Map();
const providerState = {};
const unsupportedTargets = new Set();
const disabledProviders = new Set();

let msAuthCache = { token: '', expiresAt: 0, inflight: null };
let tencentClientKey = '';
let primaryCursor = 0;

for (const id of ALL_PROVIDERS) {
  providerState[id] = { nextAt: 0, cooldownUntil: 0, failures: 0 };
}

const EMOTE_SHORTCODE = /:[a-zA-Z0-9_+-]{1,64}:/g;

function isolateEmoteShortcodes(text) {
  const kept = [];
  const isolated = String(text || '').replace(EMOTE_SHORTCODE, (shortcode) => {
    const token = `⟦S${kept.length}⟧`;
    kept.push({ token, shortcode });
    return token;
  });
  return { text: isolated, kept };
}

function restoreEmoteShortcodes(text, kept) {
  if (!text || !kept?.length) return text;
  let restored = text;
  for (const { token, shortcode } of kept) {
    restored = restored.split(token).join(shortcode);
  }
  return restored;
}

function translationCacheKey(text, targetLang) {
  return `${targetLang}\n${text}`;
}

function getCachedTranslation(text, targetLang) {
  const key = translationCacheKey(text, targetLang);
  const hit = translationCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TRANSLATION_CACHE_TTL_MS) {
    translationCache.delete(key);
    return null;
  }
  translationCache.delete(key);
  translationCache.set(key, hit);
  return hit.value;
}

function setCachedTranslation(text, targetLang, value) {
  if (!value) return;
  const key = translationCacheKey(text, targetLang);
  if (translationCache.has(key)) translationCache.delete(key);
  translationCache.set(key, { value, at: Date.now() });
  while (translationCache.size > TRANSLATION_CACHE_LIMIT) {
    const oldest = translationCache.keys().next().value;
    translationCache.delete(oldest);
  }
}

function gmRequest(options) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      timeout: TRANSLATE_TIMEOUT_MS,
      ...options,
      onload: (res) => resolve(res),
      onerror: () => reject(new Error('network error')),
      ontimeout: () => reject(new Error('timeout')),
    });
  });
}

function isRateLimited(res) {
  const status = Number(res?.status) || 0;
  if (status === 429 || status === 403 || status === 503) return true;
  const body = String(res?.responseText || '');
  return /<\s*html/i.test(body) && /sorry|too many|rate limit|quota/i.test(body);
}

function parseJwtExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000;
  } catch {
    return Date.now() + 9 * 60 * 1000;
  }
}

function toMicrosoftLang(code) {
  return MS_LANG_MAP[code] || code;
}

function getTencentClientKey() {
  if (!tencentClientKey) {
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    tencentClientKey = `browser-chrome-122.0.0-Windows_10-${uuid}`;
  }
  return tencentClientKey;
}

function detectScript(text) {
  if (/\p{Script=Hangul}/u.test(text)) return 'ko';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja';
  if (/\p{Script=Cyrillic}/u.test(text)) return 'ru';
  if (/\p{Script=Han}/u.test(text)) return 'zh';
  if (/\p{Script=Arabic}/u.test(text)) return 'ar';
  return 'latin';
}

async function getMicrosoftAuthToken() {
  const now = Date.now();
  if (msAuthCache.token && msAuthCache.expiresAt > now + 30000) {
    return msAuthCache.token;
  }

  if (msAuthCache.inflight) return msAuthCache.inflight;

  msAuthCache.inflight = (async () => {
    try {
      const res = await gmRequest({
        method: 'GET',
        url: 'https://edge.microsoft.com/translate/auth',
      });
      if (isRateLimited(res)) {
        const error = new Error('auth rate limited');
        error.rateLimited = true;
        throw error;
      }
      const token = res.responseText?.trim();
      if (!res.status || res.status >= 400 || !token) throw new Error('empty auth token');
      msAuthCache.token = token;
      msAuthCache.expiresAt = parseJwtExp(token);
      return token;
    } finally {
      msAuthCache.inflight = null;
    }
  })();

  return msAuthCache.inflight;
}

async function microsoftRequest(texts, targetLang) {
  const token = await getMicrosoftAuthToken();
  const url = `https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${encodeURIComponent(targetLang)}`;
  const res = await gmRequest({
    method: 'POST',
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(texts.map((text) => ({ Text: text }))),
  });

  if (res?.status === 401) return { ok: false, unauthorized: true, rateLimited: false };
  if (isRateLimited(res)) return { ok: false, rateLimited: true };
  if (!res || res.status !== 200) return { ok: false, rateLimited: false };

  const json = JSON.parse(res.responseText);
  if (!Array.isArray(json) || json.length !== texts.length) {
    return { ok: false, rateLimited: false };
  }

  return {
    ok: true,
    texts: json.map((item) => item?.translations?.[0]?.text || ''),
  };
}

async function microsoftTranslate(texts, targetLang) {
  const to = toMicrosoftLang(targetLang);
  let result = await microsoftRequest(texts, to);
  if (result.unauthorized) {
    msAuthCache.token = '';
    msAuthCache.expiresAt = 0;
    result = await microsoftRequest(texts, to);
  }
  if (result.unauthorized) return { ok: false, rateLimited: false };
  return result;
}

function parseGoogleBatch(json, count) {
  if (!Array.isArray(json) || json.length !== count) return null;
  const texts = [];
  for (const item of json) {
    if (typeof item === 'string') {
      texts.push(item);
      continue;
    }
    if (Array.isArray(item) && typeof item[0] === 'string') {
      texts.push(item[0]);
      continue;
    }
    return null;
  }
  return texts;
}

async function googleTranslate(texts, targetLang) {
  const query = texts.map((text) => `q=${encodeURIComponent(text)}`).join('&');
  const url = `https://translate.googleapis.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(targetLang)}&${query}`;
  const res = await gmRequest({ method: 'GET', url });

  if (isRateLimited(res)) return { ok: false, rateLimited: true };
  if (!res || res.status !== 200) return { ok: false, rateLimited: false };

  const json = JSON.parse(res.responseText);
  const parsed = parseGoogleBatch(json, texts.length);
  if (!parsed) return { ok: false, rateLimited: false };
  return { ok: true, texts: parsed };
}

async function tencentRequest(texts, targetLang) {
  const res = await gmRequest({
    method: 'POST',
    url: 'https://transmart.qq.com/api/imt',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://transmart.qq.com',
      Referer: 'https://transmart.qq.com/',
    },
    data: JSON.stringify({
      header: {
        fn: 'auto_translation',
        client_key: getTencentClientKey(),
      },
      type: 'plain',
      model_category: 'normal',
      source: {
        lang: 'auto',
        text_list: texts,
      },
      target: { lang: targetLang },
    }),
  });

  if (isRateLimited(res)) return { ok: false, rateLimited: true };
  if (!res || res.status !== 200) return { ok: false, rateLimited: false };

  const json = JSON.parse(res.responseText);
  const code = json?.header?.ret_code;
  if (code === 'succ' && Array.isArray(json.auto_translation) && json.auto_translation.length === texts.length) {
    return {
      ok: true,
      texts: json.auto_translation.map((item) => (item == null ? '' : String(item))),
    };
  }

  const message = String(json?.message || '');
  if (/unrecognized target language/i.test(message)) {
    return { ok: false, rateLimited: false, unsupported: true };
  }
  const rateLimited = code === 'Auth-Failed' || /frequent|limit|quota/i.test(message);
  return { ok: false, rateLimited };
}

async function tencentTranslate(texts, targetLang) {
  const to = TENCENT_LANG_MAP[targetLang];
  if (!to) return { ok: false, rateLimited: false, unsupported: true };
  if (unsupportedTargets.has(`tencent:${targetLang}`)) {
    return { ok: false, rateLimited: false, unsupported: true };
  }

  const buckets = new Map();
  texts.forEach((text, index) => {
    const script = detectScript(text);
    if (!buckets.has(script)) buckets.set(script, []);
    buckets.get(script).push({ text, index });
  });

  const output = texts.map(() => '');
  let translated = 0;

  for (const items of buckets.values()) {
    const result = await tencentRequest(items.map((item) => item.text), to);
    if (result.unsupported) unsupportedTargets.add(`tencent:${targetLang}`);
    if (!result.ok) {
      if (!translated) return result;
      break;
    }
    result.texts.forEach((value, index) => {
      output[items[index].index] = value;
      if (value && value.trim()) translated += 1;
    });
  }

  if (!translated) return { ok: false, rateLimited: false };
  return { ok: true, texts: output };
}

async function volcengineRequest(texts, targetLang) {
  const res = await gmRequest({
    method: 'POST',
    url: 'https://translate.volcengine.com/crx/translate/v1/',
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({
      target_language: targetLang,
      text: texts.map((text) => text.replace(/\r?\n/g, ' ')).join('\n'),
    }),
  });

  if (isRateLimited(res)) return { ok: false, rateLimited: true };
  if (!res || res.status !== 200) return { ok: false, rateLimited: false };

  const json = JSON.parse(res.responseText);
  if (json?.base_resp && Number(json.base_resp.status_code) !== 0) {
    const detail = `${json.base_resp.status_message || ''}`;
    return { ok: false, rateLimited: /limit|quota|frequent/i.test(detail) };
  }

  const parts = String(json?.translation ?? '').split('\n');
  if (parts.length !== texts.length) return { ok: false, rateLimited: false };
  return { ok: true, texts: parts };
}

async function volcengineTranslate(texts, targetLang) {
  const to = VOLC_LANG_MAP[targetLang];
  if (!to) return { ok: false, rateLimited: false, unsupported: true };

  const buckets = new Map();
  texts.forEach((text, index) => {
    const script = detectScript(text);
    if (!buckets.has(script)) buckets.set(script, []);
    buckets.get(script).push({ text, index });
  });

  const output = texts.map(() => '');
  let translated = 0;

  for (const items of buckets.values()) {
    const result = await volcengineRequest(items.map((item) => item.text), to);
    if (!result.ok) {
      if (!translated) return result;
      break;
    }
    result.texts.forEach((value, index) => {
      output[items[index].index] = value;
      if (value && value.trim()) translated += 1;
    });
  }

  if (!translated) return { ok: false, rateLimited: false };
  return { ok: true, texts: output };
}

async function caiyunTranslate(texts, targetLang) {
  const transType = CAIYUN_LANG_MAP[targetLang];
  if (!transType) return { ok: false, rateLimited: false, unsupported: true };

  const res = await gmRequest({
    method: 'POST',
    url: 'https://api.interpreter.caiyunai.com/v1/translator',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `token:${CAIYUN_TOKEN}`,
    },
    data: JSON.stringify({
      source: texts,
      trans_type: transType,
      request_id: 'youtube-danmaku',
      detect: true,
    }),
  });

  if (res?.status === 401) return { ok: false, rateLimited: false, disabled: true };
  if (res?.status === 409) return { ok: false, rateLimited: false, unsupported: true };
  if (isRateLimited(res)) return { ok: false, rateLimited: true };
  if (!res || res.status !== 200) return { ok: false, rateLimited: false };

  const json = JSON.parse(res.responseText);
  if (!Array.isArray(json?.target) || json.target.length !== texts.length) {
    return { ok: false, rateLimited: false };
  }
  return {
    ok: true,
    texts: json.target.map((item) => (item == null ? '' : String(item))),
  };
}

const PROVIDER_CALLS = {
  microsoft: microsoftTranslate,
  google: googleTranslate,
  volcengine: volcengineTranslate,
  caiyun: caiyunTranslate,
  tencent: tencentTranslate,
};

function noteProviderFailure(id, rateLimited) {
  const state = providerState[id];
  state.failures += 1;
  const table = rateLimited ? HARD_COOLDOWNS_MS : SOFT_COOLDOWNS_MS;
  const delay = table[Math.min(state.failures - 1, table.length - 1)];
  state.cooldownUntil = Date.now() + delay;
  if (rateLimited) {
    console.warn('[TBC] translation provider cooling down:', id);
  }
}

function providerReadyAt(id) {
  const state = providerState[id];
  return Math.max(state.nextAt, state.cooldownUntil);
}

function waitForProviders(ids, failed) {
  const now = Date.now();
  const wait = ids.reduce((soonest, id) => Math.min(soonest, providerReadyAt(id) - now), Infinity);
  return {
    retryAfter: Math.max(50, Math.min(Number.isFinite(wait) ? wait : 1000, 60000)),
    failed,
  };
}

function autoSequence(ready) {
  const primaryReady = PRIMARY_PROVIDERS.filter((id) => ready.includes(id));
  if (!primaryReady.length) return ready.slice();

  const id = primaryReady[primaryCursor % primaryReady.length];
  primaryCursor = (primaryCursor + 1) % primaryReady.length;
  return [id, ...ready.filter((candidate) => candidate !== id)];
}

function markProviderUsed(id, startedAt) {
  const elapsed = Date.now() - startedAt;
  providerState[id].nextAt = Date.now() + Math.max(0, PROVIDER_GAP_MS - elapsed);
}

async function translateBatch(texts, targetLang, preferred) {
  if (!texts.length) return { texts: [] };

  const order = preferred && preferred !== 'auto'
    ? [preferred, ...ALL_PROVIDERS.filter((id) => id !== preferred)]
    : ALL_PROVIDERS.slice();
  const supported = order.filter((id) => (
    !disabledProviders.has(id) && !unsupportedTargets.has(`${id}:${targetLang}`)
  ));
  const candidates = supported.length ? supported : order;
  const now = Date.now();

  if (preferred && preferred !== 'auto' && candidates[0] === preferred) {
    const pinned = providerState[preferred];
    if (pinned.cooldownUntil <= now && pinned.nextAt > now) {
      return waitForProviders([preferred], false);
    }
  }

  const usable = candidates.filter((id) => providerState[id].cooldownUntil <= now);
  if (!usable.length) return waitForProviders(candidates, true);

  const ready = usable.filter((id) => providerState[id].nextAt <= now);
  if (!ready.length) return waitForProviders(usable, false);

  const sequence = !preferred || preferred === 'auto'
    ? autoSequence(ready)
    : [preferred, ...ready.filter((id) => id !== preferred)].filter((id) => ready.includes(id));

  const flushStarted = Date.now();
  const attemptLimit = Math.min(MAX_PROVIDER_ATTEMPTS, sequence.length);
  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    if (attempt > 0 && Date.now() - flushStarted > TRANSLATE_TIMEOUT_MS) break;
    const id = sequence[attempt];
    const startedAt = Date.now();
    let result;
    try {
      result = await PROVIDER_CALLS[id](texts, targetLang);
    } catch (err) {
      result = { ok: false, rateLimited: !!err?.rateLimited };
    }
    markProviderUsed(id, startedAt);

    if (result?.disabled) {
      disabledProviders.add(id);
      continue;
    }
    if (result?.unsupported) unsupportedTargets.add(`${id}:${targetLang}`);
    if (result?.ok && Array.isArray(result.texts) && result.texts.length === texts.length) {
      providerState[id].failures = 0;
      return { texts: result.texts };
    }
    noteProviderFailure(id, !!result?.rateLimited);
  }

  return { retryAfter: 800, failed: true };
}

const TOOLTIP_ORIGINAL_MAX = 64;

function withoutEmoteTokens(text) {
  return String(text || '').replace(/⟦[ETS]\d+⟧/g, ' ');
}

function shouldSkipTranslation(text) {
  const trimmed = withoutEmoteTokens(text).trim();
  if (!trimmed) return true;
  if (/^[\d\s+\-*/%=^#@&|<>[\]{}\\]+$/u.test(trimmed)) return true;
  if (/^[\p{P}\p{S}\s\d]+$/u.test(trimmed)) return true;
  return false;
}

function needsMachineTranslation(text) {
  return !!withoutEmoteTokens(text).trim();
}

function truncateText(text, max = TOOLTIP_ORIGINAL_MAX) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function preparedGroupKey(preparedText, placeholders) {
  return `${preparedText}\0${placeholders.map((item) => item.replacement).join('\0')}`;
}

async function translateMessages(texts, targetLang, provider = 'microsoft') {
  const results = new Array(texts.length);
  const pending = [];

  texts.forEach((text, index) => {
    const cached = getCachedTranslation(text, targetLang);
    if (cached != null) {
      results[index] = cached;
      return;
    }

    const isolated = isolateEmoteShortcodes(text);
    if (shouldSkipTranslation(isolated.text) || text.length > 500) {
      results[index] = text;
      return;
    }

    const prepared = prepareDictionaryText(isolated.text, targetLang);
    const restore = (value) => restoreEmoteShortcodes(
      restoreDictionaryText(value, prepared.placeholders),
      isolated.kept,
    );
    if (prepared.fullyMapped || !needsMachineTranslation(prepared.preparedText)) {
      results[index] = restore(prepared.preparedText);
      return;
    }

    pending.push({
      index,
      original: text,
      preparedText: prepared.preparedText,
      placeholders: prepared.placeholders,
      kept: isolated.kept,
    });
  });

  if (!pending.length) return { texts: results };

  const groups = new Map();
  for (const item of pending) {
    const key = preparedGroupKey(item.preparedText, item.placeholders);
    if (!groups.has(key)) {
      groups.set(key, { preparedText: item.preparedText, items: [] });
    }
    groups.get(key).items.push(item);
  }

  const unique = [...groups.values()];
  const outcome = await translateBatch(
    unique.map((group) => group.preparedText),
    targetLang,
    provider,
  );
  if (outcome.retryAfter) return outcome;

  unique.forEach((group, groupIndex) => {
    const machine = outcome.texts[groupIndex]?.trim()
      ? outcome.texts[groupIndex]
      : group.preparedText;
    const cacheable = !!outcome.texts[groupIndex]?.trim();

    for (const item of group.items) {
      const restored = restoreEmoteShortcodes(
        restoreDictionaryText(machine, item.placeholders),
        item.kept,
      )?.trim() || item.original;
      results[item.index] = restored;
      if (cacheable) setCachedTranslation(item.original, targetLang, restored);
    }
  });

  return { texts: results };
}

const TRANSLATE_SINGLE_GRACE_MS = 220;
const TRANSLATE_BURST_WINDOW_MS = 1000;
const TRANSLATE_GIVE_UP_ATTEMPTS = 2;

class TranslateQueue {
  constructor(getSettings, isActive) {
    this.getSettings = getSettings;
    this.isActive = isActive;
    this.queue = [];
    this.inflight = false;
    this.timer = null;
    this.timerDelay = null;
    this.epoch = 0;
    this.nextSlotAt = 0;
    this.collectStartedAt = 0;
  }

  currentSpeed() {
    return clamp(Number(this.getSettings().translateSpeed) || 1, 1, 10);
  }

  enqueue(text, callback) {
    if (!this.isActive()) return;
    const settings = this.getSettings();
    if (!settings.translateEnabled) return;

    while (this.queue.length >= MAX_TRANSLATE_QUEUE) {
      this.queue.shift();
    }
    if (!this.collectStartedAt) this.collectStartedAt = Date.now();
    this.queue.push({ text, callback, attempts: 0 });
    this.schedule();
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.timerDelay = null;
  }

  armTimer(delay) {
    this.clearTimer();
    this.timerDelay = delay;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.timerDelay = null;
      this.flush();
    }, delay);
  }

  schedule() {
    if (this.inflight || !this.isActive()) return;
    if (!this.getSettings().translateEnabled) return;

    if (this.queue.length === 0) {
      this.collectStartedAt = 0;
      this.clearTimer();
      return;
    }

    const delay = this.computeDelay();
    if (delay === 0 && this.timer && this.timerDelay === 0) return;
    this.armTimer(delay);
  }

  computeDelay() {
    const now = Date.now();
    const speed = this.currentSpeed();
    const slotWait = Math.max(0, this.nextSlotAt - now);
    const started = this.collectStartedAt || now;

    if (this.queue.length >= speed) return slotWait;

    const grace = speed <= 1 || this.queue.length < 2
      ? (speed <= 1 ? 0 : TRANSLATE_SINGLE_GRACE_MS)
      : TRANSLATE_BURST_WINDOW_MS;
    const collectWait = Math.max(0, started + grace - now);
    return Math.max(slotWait, collectWait);
  }

  takeJobs(speed) {
    const jobs = [];
    let chars = 0;

    while (this.queue.length && jobs.length < Math.min(speed, TRANSLATE_MAX_BATCH)) {
      const next = this.queue[0];
      if (jobs.length > 0 && chars + next.text.length > TRANSLATE_MAX_BATCH_CHARS) break;
      chars += next.text.length;
      jobs.push(this.queue.shift());
    }

    return jobs;
  }

  deliver(jobs, texts) {
    if (!this.isActive()) return;
    jobs.forEach((job, index) => {
      const translated = typeof texts[index] === 'string' ? texts[index] : job.text;
      try {
        job.callback(translated, job.text);
      } catch {
        /* ignore */
      }
    });
  }

  pace(count, speed, startedAt) {
    const spent = Date.now() - startedAt;
    const budget = Math.round(count * (1000 / speed));
    const nextAt = Date.now() + Math.max(0, budget - spent);
    this.nextSlotAt = Math.max(this.nextSlotAt, nextAt);
  }

  async flush() {
    if (this.inflight || this.queue.length === 0 || !this.isActive()) {
      this.schedule();
      return;
    }

    const settings = this.getSettings();
    if (!settings.translateEnabled) return;

    const epoch = this.epoch;
    const speed = this.currentSpeed();
    const jobs = this.takeJobs(speed);
    if (!jobs.length) return;

    this.collectStartedAt = this.queue.length ? Date.now() : 0;
    this.inflight = true;
    const startedAt = Date.now();

    try {
      const outcome = await translateMessages(
        jobs.map((job) => job.text),
        settings.translateTargetLang,
        settings.translateProvider,
      );

      if (epoch !== this.epoch || !this.isActive()) return;

      if (outcome.retryAfter) {
        const failed = !!outcome.failed;
        if (failed) {
          for (const job of jobs) job.attempts += 1;
        }
        const exhausted = failed && jobs.every((job) => job.attempts >= TRANSLATE_GIVE_UP_ATTEMPTS);
        const blocked = failed && outcome.retryAfter > 1500;
        if (exhausted || blocked) {
          this.deliver(jobs, jobs.map((job) => job.text));
          this.pace(jobs.length, speed, startedAt);
        } else {
          this.queue = jobs.concat(this.queue);
          while (this.queue.length > MAX_TRANSLATE_QUEUE) this.queue.pop();
          this.collectStartedAt = Date.now() - TRANSLATE_BURST_WINDOW_MS;
          this.nextSlotAt = Math.max(this.nextSlotAt, Date.now() + outcome.retryAfter);
        }
        return;
      }

      this.deliver(jobs, outcome.texts || []);
      this.pace(jobs.length, speed, startedAt);
    } catch {
      if (epoch !== this.epoch || !this.isActive()) return;
      this.deliver(jobs, jobs.map((job) => job.text));
      this.pace(jobs.length, speed, startedAt);
    } finally {
      if (epoch === this.epoch) this.inflight = false;
      if (this.queue.length && epoch === this.epoch) this.schedule();
    }
  }

  clear() {
    this.epoch += 1;
    this.queue = [];
    this.collectStartedAt = 0;
    this.nextSlotAt = 0;
    this.clearTimer();
    this.inflight = false;
  }
}

const MAX_REPEAT_SEGMENTS = 3;

function dedupeRepeatedMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const tokens = trimmed.split(/\s+/);
  if (tokens.length <= MAX_REPEAT_SEGMENTS) return text;

  const maxUnitLen = Math.floor(tokens.length / (MAX_REPEAT_SEGMENTS + 1));

  for (let unitLen = 1; unitLen <= maxUnitLen; unitLen += 1) {
    if (tokens.length % unitLen !== 0) continue;

    const repeatCount = tokens.length / unitLen;
    if (repeatCount <= MAX_REPEAT_SEGMENTS) continue;

    const unit = tokens.slice(0, unitLen);
    let matched = true;

    for (let i = 1; i < repeatCount; i += 1) {
      for (let j = 0; j < unitLen; j += 1) {
        if (tokens[i * unitLen + j] !== unit[j]) {
          matched = false;
          break;
        }
      }
      if (!matched) break;
    }

    if (matched) {
      const kept = [];
      for (let i = 0; i < MAX_REPEAT_SEGMENTS; i += 1) {
        kept.push(...unit);
      }
      return kept.join(' ');
    }
  }

  return text;
}

const EMOTE_HOST = /(^|\.)(ggpht\.com|googleusercontent\.com|ytimg\.com|youtube\.com)$/i;

function safeEmoteSrc(src) {
  if (!src) return '';
  try {
    const url = new URL(src, 'https://www.youtube.com');
    if (url.protocol !== 'https:') return '';
    if (!EMOTE_HOST.test(url.hostname)) return '';
    return url.href;
  } catch (_) {
    return '';
  }
}

function isEmoteImage(node) {
  if (node.tagName !== 'IMG') return false;
  const src = safeEmoteSrc(node.currentSrc || node.getAttribute('src'));
  if (!src) return false;
  if (node.id === 'emoji' || node.classList.contains('emoji') || node.classList.contains('small-emoji')) {
    return true;
  }
  if (node.closest('#author-photo, #author-name, yt-live-chat-author-chip')) return false;
  return !!node.closest('#message, #sticker');
}

function pushTextPart(parts, text) {
  if (!text) return;
  const last = parts[parts.length - 1];
  if (last?.type === 'text') last.text += text;
  else parts.push({ type: 'text', text });
}

function collectParts(root) {
  if (!root) return [];
  const parts = [];

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushTextPart(parts, node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const id = node.id;
    if (id === 'author-name' || id === 'timestamp' || id === 'chat-badges' || id === 'author-photo') return;

    const tag = node.tagName;
    if (tag === 'YT-LIVE-CHAT-AUTHOR-CHIP' || tag === 'YT-ICON') return;

    if (tag === 'IMG' && isEmoteImage(node)) {
      const src = safeEmoteSrc(node.currentSrc || node.getAttribute('src'));
      const alt = (node.getAttribute('alt') || node.getAttribute('shared-tooltip-text') || '').trim();
      parts.push({ type: 'emote', alt, src });
      return;
    }

    if (tag === 'IMG') {
      const alt = node.getAttribute('alt') || node.getAttribute('shared-tooltip-text') || '';
      if (alt) pushTextPart(parts, ` ${alt} `);
      return;
    }

    for (const child of node.childNodes) walk(child);
  };

  walk(root);
  return parts;
}

function partsToText(parts) {
  return parts.map((part) => (part.type === 'emote' ? (part.alt ? ` ${part.alt} ` : ' ') : part.text))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function shieldEmoteParts(parts) {
  const emotes = [];
  let text = '';
  for (const part of parts) {
    if (part.type === 'emote') {
      text += ` ⟦E${emotes.length}⟧ `;
      emotes.push(part);
    } else {
      text += part.text;
    }
  }
  return { text: text.replace(/\s+/g, ' ').trim(), emotes };
}

function restoreEmoteParts(translated, emotes) {
  if (!emotes.length) return [{ type: 'text', text: translated }];

  const parts = [];
  const pattern = /⟦E(\d+)⟧/g;
  let last = 0;
  let found = 0;
  let match = pattern.exec(translated);
  while (match) {
    const chunk = translated.slice(last, match.index);
    if (chunk) parts.push({ type: 'text', text: chunk });
    const emote = emotes[Number(match[1])];
    if (emote) {
      parts.push(emote);
      found += 1;
    }
    last = match.index + match[0].length;
    match = pattern.exec(translated);
  }
  const tail = translated.slice(last);
  if (tail) parts.push({ type: 'text', text: tail });
  if (found !== emotes.length) return null;
  return parts;
}

function extractMessageParts(msgEl) {
  const parts = [];
  const amount = msgEl.querySelector('#purchase-amount, #purchase-amount-chip')?.textContent?.trim();
  if (amount) pushTextPart(parts, `${amount} `);

  const messageEl = msgEl.querySelector('#message');
  if (messageEl) {
    parts.push(...collectParts(messageEl));
  } else {
    const primary = collectParts(msgEl.querySelector('#header-primary-text, #primary-text'));
    const sub = collectParts(msgEl.querySelector('#header-subtext'));
    parts.push(...primary, ...sub);
    const sticker = msgEl.querySelector('#sticker img, img.yt-live-chat-paid-sticker-renderer');
    if (sticker && !parts.some((part) => part.src && part.src === safeEmoteSrc(sticker.getAttribute('src')))) {
      if (isEmoteImage(sticker)) parts.push(...collectParts(sticker));
      else pushTextPart(parts, sticker.getAttribute('alt') || '');
    }
  }

  return parts;
}

function parseChatMessage(msgEl) {
  if (!msgEl || msgEl.classList.contains('ydm-processed')) return null;
  if (msgEl.hasAttribute('is-deleted')) return null;

  const parts = extractMessageParts(msgEl);
  const rawMessage = partsToText(parts);
  if (!rawMessage && !parts.some((part) => part.type === 'emote')) return null;

  const message = dedupeRepeatedMessage(rawMessage) || rawMessage;
  const usernameEl = msgEl.querySelector('#author-name');
  const username = usernameEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const usernameColor = getUsernameColor(msgEl, username);
  const profileUrl = getYouTubeProfileUrl(msgEl);
  const superchat = msgEl.tagName === 'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER'
    || msgEl.tagName === 'YT-LIVE-CHAT-PAID-STICKER-RENDERER';

  msgEl.classList.add('ydm-processed');
  return {
    message,
    parts,
    username,
    usernameColor,
    profileUrl,
    superchat,
    superchatStyle: superchat ? readSuperchatStyle(msgEl) : null,
  };
}

function readSuperchatStyle(msgEl) {
  const header = msgEl.querySelector('#header') || msgEl.querySelector('#card');
  const headerStyle = header ? getComputedStyle(header) : null;
  const background = usableCssColor(headerStyle?.backgroundColor) || '#e53935';
  const color = usableCssColor(headerStyle?.color) || '#ffffff';
  return { background, color };
}

function usableCssColor(value) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
  return value;
}

function markExistingMessages(chatRoot) {
  chatRoot.querySelectorAll(SELECTORS.chatMessage).forEach((el) => {
    el.classList.add('ydm-processed');
  });
}

function isLiveMessage(msgEl, chatRoot) {
  const messages = chatRoot.querySelectorAll(SELECTORS.chatMessage);
  if (!messages.length) return true;

  const tailStart = Math.max(0, messages.length - LIVE_MESSAGE_TAIL);
  for (let i = tailStart; i < messages.length; i += 1) {
    const node = messages[i];
    if (node === msgEl || node.contains(msgEl) || msgEl.contains(node)) return true;
  }
  return false;
}

class ChatObserver {
  constructor({ getSettings, danmakuEmitter, translateQueue, isActive }) {
    this.getSettings = getSettings;
    this.danmakuEmitter = danmakuEmitter;
    this.translateQueue = translateQueue;
    this.isActive = isActive;
    this.observer = null;
    this.chatRoot = null;
    this.readyAt = 0;
    this.stopped = false;
    this.starting = false;
    this.nextTryAt = 0;
    this.seenIds = new Set();
  }

  isConnected() {
    return !!this.chatRoot?.isConnected;
  }

  async start() {
    if (this.starting || this.isConnected()) return;
    if (Date.now() < this.nextTryAt) return;

    this.starting = true;
    this.stopped = false;
    this.observer?.disconnect();
    this.observer = null;

    try {
      const chatRoot = await waitForChatList(() => this.stopped);
      if (this.stopped) return;
      if (!chatRoot) {
        this.nextTryAt = Date.now() + 4000;
        console.warn('[YDM] Live chat list not found');
        return;
      }

      this.chatRoot = chatRoot;
      markExistingMessages(this.chatRoot);
      this.readyAt = Date.now();

      this.observer = new MutationObserver((mutations) => {
        if (!this.isActive()) return;
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent) this.handleNode(parent);
            continue;
          }
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              if (node.parentElement) this.handleNode(node.parentElement);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleNode(node);
            }
          }
        }
      });

      this.observer.observe(this.chatRoot, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      console.log('[YDM] Chat observer started');
    } finally {
      this.starting = false;
    }
  }

  stop() {
    this.stopped = true;
    this.observer?.disconnect();
    this.observer = null;
    this.chatRoot = null;
    this.seenIds.clear();
  }

  remember(msgEl) {
    const id = msgEl.id;
    if (!id) return;
    this.seenIds.add(id);
    if (this.seenIds.size > 2000) {
      const oldest = this.seenIds.values().next().value;
      this.seenIds.delete(oldest);
    }
  }

  shouldEmit(msgEl) {
    if (!this.isActive()) return false;
    if (msgEl.classList.contains('ydm-processed')) return false;
    if (msgEl.id && this.seenIds.has(msgEl.id)) {
      msgEl.classList.add('ydm-processed');
      return false;
    }

    if (Date.now() - this.readyAt < WARMUP_MS) {
      msgEl.classList.add('ydm-processed');
      this.remember(msgEl);
      return false;
    }

    if (!isLiveMessage(msgEl, this.chatRoot)) {
      msgEl.classList.add('ydm-processed');
      this.remember(msgEl);
      return false;
    }

    return true;
  }

  handleNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const found = [];
    if (node.matches?.(SELECTORS.chatMessage)) found.push(node);
    if (node.querySelectorAll) found.push(...node.querySelectorAll(SELECTORS.chatMessage));
    const parentMessage = node.closest?.(SELECTORS.chatMessage);
    if (parentMessage) found.push(parentMessage);

    const seen = new Set();
    for (const msgEl of found) {
      if (seen.has(msgEl)) continue;
      seen.add(msgEl);
      if (!this.shouldEmit(msgEl)) continue;
      const parsed = parseChatMessage(msgEl);
      if (!parsed) continue;
      this.remember(msgEl);
      this.emitDanmaku(parsed);
    }
  }

  emitDanmaku(parsed) {
    const settings = this.getSettings();
    if (!this.isActive() || !settings.enabled) return;

    if (messageMatchesBlock(parsed.message, settings.blockKeywords)) return;

    const shielded = shieldEmoteParts(parsed.parts);
    const base = {
      username: parsed.username,
      usernameColor: parsed.usernameColor,
      profileUrl: parsed.profileUrl,
      originalMessage: parsed.message,
      parts: parsed.parts,
      superchat: !!parsed.superchat,
      superchatStyle: parsed.superchatStyle || null,
    };

    if (!settings.translateEnabled) {
      this.danmakuEmitter.enqueue({
        ...base,
        message: parsed.message,
        translated: false,
      });
      return;
    }

    this.translateQueue.enqueue(shielded.text, (translated, original) => {
      if (!this.isActive()) return;
      const latest = this.getSettings();
      const rendered = translated?.trim() ? translated : original;
      const parts = restoreEmoteParts(rendered, shielded.emotes) || parsed.parts;
      const message = partsToText(parts) || parsed.message;
      if (messageMatchesBlock(parsed.message, latest.blockKeywords)) return;
      if (messageMatchesBlock(message, latest.blockKeywords)) return;
      this.danmakuEmitter.enqueue({
        ...base,
        parts,
        message,
        translated: message !== parsed.message,
      });
    });
  }
}

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

function injectStyles() {
  GM_addStyle(`
    .ydm-danmaku-layer {
      pointer-events: none;
      overflow: hidden;
    }

    .ydm-danmaku-item {
      position: absolute;
      left: 100%;
      white-space: nowrap;
      font-weight: 700;
      line-height: 1.2;
      pointer-events: auto;
      cursor: default;
      user-select: none;
      text-shadow:
        1px 1px 2px rgba(0, 0, 0, 0.9),
        -1px -1px 2px rgba(0, 0, 0, 0.9),
        0 0 4px rgba(0, 0, 0, 0.8);
      animation: ydm-scroll var(--ydm-duration, 8s) linear forwards;
      will-change: transform;
    }

    .ydm-emote {
      display: inline-block;
      width: 1.15em;
      height: 1.15em;
      margin: 0 0.08em;
      vertical-align: -0.2em;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
    }

    .ydm-emote img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      font-size: 0;
      pointer-events: none;
    }

    .ydm-danmaku-item.ydm-paused {
      animation-play-state: paused;
      z-index: 20;
      cursor: pointer;
    }

    .ydm-danmaku-item.ydm-paused.ydm-click-locked {
      z-index: 30;
    }

    .ydm-superchat-layer {
      pointer-events: none;
      display: none;
      align-items: center;
      justify-content: center;
      overflow: visible;
    }

    .ydm-superchat-item {
      position: relative;
      max-width: calc(100% - 24px);
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: 700;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: auto;
      cursor: pointer;
      user-select: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      animation-duration: var(--ydm-sc-duration, 6s);
      animation-timing-function: ease;
      animation-fill-mode: forwards;
    }

    .ydm-superchat-item.ydm-sc-fade,
    .ydm-superchat-item.ydm-sc-shine {
      animation-name: ydm-sc-fade;
    }

    .ydm-superchat-item.ydm-sc-slide {
      animation-name: ydm-sc-slide;
    }

    .ydm-superchat-layer.ydm-sc-bottom .ydm-superchat-item.ydm-sc-slide {
      animation-name: ydm-sc-slide-up;
    }

    .ydm-superchat-item.ydm-sc-pop {
      animation-name: ydm-sc-pop;
    }

    .ydm-superchat-item.ydm-sc-shine::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 28%, rgba(255, 255, 255, 0.55) 50%, transparent 72%);
      transform: translateX(-130%);
      animation: ydm-sc-shine-sweep 1.15s ease 0.25s;
      pointer-events: none;
    }

    .ydm-superchat-item.ydm-paused,
    .ydm-superchat-item.ydm-paused.ydm-click-locked {
      animation-play-state: paused;
      z-index: 20;
    }

    @keyframes ydm-sc-fade {
      0% { opacity: 0; }
      12% { opacity: 1; }
      88% { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes ydm-sc-slide {
      0% { opacity: 0; transform: translateY(-14px); }
      14% { opacity: 1; transform: translateY(0); }
      86% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(10px); }
    }

    @keyframes ydm-sc-slide-up {
      0% { opacity: 0; transform: translateY(14px); }
      14% { opacity: 1; transform: translateY(0); }
      86% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); }
    }

    @keyframes ydm-sc-pop {
      0% { opacity: 0; transform: scale(0.7); }
      16% { opacity: 1; transform: scale(1); }
      86% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.92); }
    }

    @keyframes ydm-sc-shine-sweep {
      from { transform: translateX(-130%); }
      to { transform: translateX(130%); }
    }

    .ydm-click-lock-backdrop {
      position: absolute;
      inset: 0;
      z-index: 25;
      pointer-events: auto;
      background: transparent;
    }

    .ydm-danmaku-tooltip {
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: auto;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45));
      max-width: min(280px, calc(100vw - 16px));
      overflow: hidden;
    }

    .ydm-danmaku-tooltip-bubble {
      background: rgba(15, 15, 15, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 6px 8px;
      max-width: min(280px, 100%);
      min-height: 0;
      overflow-y: auto;
      user-select: text;
    }

    .ydm-danmaku-tooltip-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
    }

    .ydm-danmaku-tooltip-header--solo {
      justify-content: flex-end;
    }

    .ydm-danmaku-tooltip-name {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.3;
      word-break: break-word;
      text-decoration: none;
    }

    a.ydm-danmaku-tooltip-name {
      cursor: pointer;
    }

    a.ydm-danmaku-tooltip-name:hover {
      text-decoration: underline;
    }

    .ydm-danmaku-tooltip-actions {
      display: flex;
      flex-shrink: 0;
      gap: 2px;
    }

    .ydm-danmaku-tooltip-copy,
    .ydm-danmaku-tooltip-speak {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: clamp(24px, 6vw, 28px);
      height: clamp(24px, 6vw, 28px);
      padding: 0;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #e5e5e5;
      cursor: pointer;
    }

    .ydm-danmaku-tooltip-copy:hover,
    .ydm-danmaku-tooltip-speak:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    .ydm-danmaku-tooltip-copy svg,
    .ydm-danmaku-tooltip-speak svg {
      width: clamp(14px, 3.5vw, 16px);
      height: clamp(14px, 3.5vw, 16px);
      fill: currentColor;
      display: block;
    }

    .ydm-danmaku-tooltip-original {
      margin-top: 4px;
      color: #aaa;
      font-size: 11px;
      line-height: 1.3;
      word-break: break-word;
    }

    .ydm-danmaku-tooltip-tail {
      width: 6px;
      height: 6px;
      flex-shrink: 0;
      background: rgba(15, 15, 15, 0.96);
      transform: rotate(45deg);
    }

    .ydm-danmaku-tooltip--above .ydm-danmaku-tooltip-tail {
      margin: -3px auto 0;
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .ydm-danmaku-tooltip--below .ydm-danmaku-tooltip-bubble {
      order: 2;
    }

    .ydm-danmaku-tooltip--below .ydm-danmaku-tooltip-tail {
      order: 1;
      margin: 0 auto -3px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 1px solid rgba(255, 255, 255, 0.12);
    }

    @keyframes ydm-scroll {
      from { transform: translateX(var(--ydm-start, 0px)); }
      to { transform: translateX(calc(-1 * var(--ydm-travel, 100vw))); }
    }

    .ytp-right-controls > .ydm-controls-wrap {
      display: inline-flex !important;
      align-items: center !important;
      height: 100% !important;
      flex: 0 0 auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .ydm-control-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 100%;
      min-height: 36px;
      padding: 0;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      opacity: 0.9;
      flex-shrink: 0;
    }

    .ydm-control-btn:hover,
    .ydm-control-btn.ydm-active {
      opacity: 1;
    }

    .ydm-control-btn svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
      display: block;
    }

    .ydm-danmaku-btn .ydm-icon {
      display: none;
      line-height: 0;
    }

    .ydm-danmaku-btn.ydm-danmaku-enabled .ydm-icon-on,
    .ydm-danmaku-btn.ydm-danmaku-disabled .ydm-icon-off {
      display: block;
    }

    .ydm-speech-btn .ydm-icon {
      display: none;
      line-height: 0;
    }

    .ydm-speech-btn.ydm-speech-on .ydm-icon-on,
    .ydm-speech-btn.ydm-speech-mute .ydm-icon-mute,
    .ydm-speech-btn.ydm-speech-off .ydm-icon-off {
      display: block;
    }

    .ydm-speech-btn.ydm-speech-mute {
      opacity: 0.7;
    }

    .ydm-speech-btn.ydm-speech-off {
      opacity: 0.45;
    }

    .ydm-danmaku-btn.ydm-danmaku-disabled {
      opacity: 0.45;
    }

    .ydm-balloon {
      background: #212121;
      color: #f1f1f1;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
      font-family: Roboto, Arial, sans-serif;
      font-size: 14px;
      overflow: hidden;
    }

    .ydm-balloon-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 12px 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .ydm-balloon-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }

    .ydm-balloon-close {
      background: none;
      border: none;
      color: #ff4e45;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
    }

    .ydm-balloon-close:hover {
      background: rgba(255, 78, 69, 0.12);
    }

    .ydm-balloon-body {
      padding: 4px 0 8px;
      max-height: min(60vh, 420px);
      overflow-y: auto;
    }

    .ydm-balloon-body--speech {
      max-height: min(70vh, 520px);
    }

    .ydm-balloon-section {
      padding: 6px 12px 0;
      color: #aaa;
      font-size: 12px;
      font-weight: 600;
    }

    .ydm-speech-modes {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
    }

    .ydm-speech-mode {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      background: #0f0f0f;
      color: #aaa;
      cursor: pointer;
      font-size: 12px;
      line-height: 1.2;
    }

    .ydm-speech-mode svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
      display: block;
    }

    .ydm-speech-mode:hover,
    .ydm-speech-mode.ydm-active {
      color: #fff;
      border-color: #ff4e45;
      background: rgba(255, 78, 69, 0.12);
    }

    .ydm-speech-test {
      display: flex;
      gap: 6px;
    }

    .ydm-speech-test .ydm-balloon-input {
      flex: 1;
      min-width: 0;
    }

    .ydm-speech-play {
      flex-shrink: 0;
      min-width: 36px;
      border: none;
      border-radius: 8px;
      background: #3a3a3a;
      color: #f1f1f1;
      cursor: pointer;
      font-size: 12px;
    }

    .ydm-speech-play:hover {
      background: #4a4a4a;
    }

    .ydm-speech-note {
      margin: 0;
      padding: 0 12px 8px;
      color: #aaa;
      font-size: 12px;
      line-height: 1.4;
    }

    .ydm-balloon-row {
      padding: 8px 12px;
    }

    .ydm-balloon-row--toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ydm-balloon-row--field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ydm-balloon-field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ydm-balloon-label {
      color: #f1f1f1;
      font-size: 13px;
      line-height: 1.4;
    }

    .ydm-balloon-value {
      color: #aaa;
      font-size: 12px;
    }

    .ydm-balloon-range {
      width: 100%;
      accent-color: #ff4e45;
      height: 4px;
    }

    .ydm-balloon-select,
    .ydm-balloon-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      background: #0f0f0f;
      color: #f1f1f1;
      font-size: 13px;
    }

    .ydm-keyword-hint {
      color: #aaa;
      font-size: 12px;
      line-height: 1.4;
    }

    .ydm-keyword-add {
      display: flex;
      gap: 6px;
    }

    .ydm-keyword-add-btn {
      flex-shrink: 0;
      border: none;
      border-radius: 8px;
      background: #3a3a3a;
      color: #f1f1f1;
      padding: 0 10px;
      cursor: pointer;
    }

    .ydm-keyword-add-btn:hover {
      background: #4a4a4a;
    }

    .ydm-keyword-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ydm-keyword-list:empty {
      display: none;
    }

    .ydm-keyword-chip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      max-width: 100%;
      padding: 2px 2px 2px 8px;
      border-radius: 999px;
      background: #3a3a3a;
      color: #f1f1f1;
      font-size: 12px;
    }

    .ydm-keyword-chip > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ydm-keyword-remove {
      width: 18px;
      height: 18px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: #aaa;
      cursor: pointer;
      line-height: 18px;
    }

    .ydm-keyword-remove:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.12);
    }

    .ydm-balloon-divider {
      height: 1px;
      margin: 4px 12px;
      background: rgba(255, 255, 255, 0.08);
    }

    .ydm-history-status {
      margin: 0;
      padding: 4px 12px 8px;
      color: #aaa;
      font-size: 12px;
      line-height: 1.45;
      min-height: 1.45em;
    }

    .ydm-history-status:empty {
      display: none;
    }

    .ydm-history-status--error {
      color: #ff8a80;
    }

    .ydm-history-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 12px 12px;
    }

    .ydm-history-download,
    .ydm-history-pause,
    .ydm-history-resume,
    .ydm-history-cancel {
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .ydm-history-download {
      flex: 1 1 100%;
      background: #ff4e45;
      color: #fff;
    }

    .ydm-history-pause,
    .ydm-history-resume {
      flex: 1 1 auto;
      background: #3ea6ff;
      color: #0f0f0f;
    }

    .ydm-history-cancel {
      flex: 1 1 auto;
      background: #272727;
      color: #fff;
    }

    .ydm-history-download:disabled,
    .ydm-history-pause:disabled,
    .ydm-history-resume:disabled,
    .ydm-history-cancel:disabled {
      opacity: 0.6;
      cursor: default;
    }

    .ydm-history-download[hidden],
    .ydm-history-pause[hidden],
    .ydm-history-resume[hidden],
    .ydm-history-cancel[hidden] {
      display: none;
    }

    .ydm-switch {
      position: relative;
      width: 40px;
      height: 22px;
      flex-shrink: 0;
    }

    .ydm-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .ydm-switch-slider {
      position: absolute;
      inset: 0;
      background: #3a3a3a;
      border-radius: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .ydm-switch-slider::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .ydm-switch input:checked + .ydm-switch-slider {
      background: #ff4e45;
    }

    .ydm-switch input:checked + .ydm-switch-slider::before {
      transform: translateX(18px);
    }
  `);
}

const ICON_DANMAKU_ON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M11.989 4.828c-.47 0-.975.004-1.515.012l-1.71-2.566a1.008 1.008 0 0 0-1.678 1.118l.999 1.5c-.681.018-1.403.04-2.164.068a4.013 4.013 0 0 0-3.83 3.44c-.165 1.15-.245 2.545-.245 4.185 0 1.965.115 3.67.35 5.116a4.012 4.012 0 0 0 3.763 3.363l.906.046c1.205.063 1.808.095 3.607.095a.988.988 0 0 0 0-1.975c-1.758 0-2.339-.03-3.501-.092l-.915-.047a2.037 2.037 0 0 1-1.91-1.708c-.216-1.324-.325-2.924-.325-4.798 0-1.563.076-2.864.225-3.904.14-.977.96-1.713 1.945-1.747 2.444-.087 4.465-.13 6.063-.131 1.598 0 3.62.044 6.064.13.96.034 1.71.81 1.855 1.814.075.524.113 1.962.141 3.065v.002c.01.342.017.65.025.88a.987.987 0 1 0 1.974-.068c-.008-.226-.016-.523-.025-.856v-.027c-.03-1.118-.073-2.663-.16-3.276-.273-1.906-1.783-3.438-3.74-3.507-.9-.032-1.743-.058-2.531-.078l1.05-1.46a1.008 1.008 0 0 0-1.638-1.177l-1.862 2.59c-.38-.004-.744-.007-1.088-.007h-.13Zm.521 4.775h-1.32v4.631h2.222v.847h-2.618v1.078h2.618l.003.678c.36.026.714.163 1.01.407h.11v-1.085h2.694v-1.078h-2.695v-.847H16.8v-4.63h-1.276a8.59 8.59 0 0 0 .748-1.42L15.183 7.8a14.232 14.232 0 0 1-.814 1.804h-1.518l.693-.308a8.862 8.862 0 0 0-.814-1.408l-1.045.352c.297.396.572.847.825 1.364Zm-4.18 3.564.154-1.485h1.98V8.294h-3.2v.98H9.33v1.43H7.472l-.308 3.453h2.277c0 1.166-.044 1.925-.12 2.277-.078.352-.386.528-.936.528-.308 0-.616-.022-.902-.055l.297 1.067.062.005c.285.02.551.04.818.04 1.001-.067 1.562-.419 1.694-1.057.11-.638.176-1.903.176-3.795h-2.2Zm7.458.11v-.858h-1.254v.858h1.254Zm-2.376-.858v.858h-1.199v-.858h1.2Zm-1.199-.946h1.2v-.902h-1.2v.902Zm2.321 0v-.902h1.254v.902h-1.254Z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M22.846 14.627a1 1 0 0 0-1.412.075l-5.091 5.703-2.216-2.275-.097-.086-.008-.005a1 1 0 0 0-1.322 1.493l2.963 3.041.093.083.007.005c.407.315 1 .27 1.354-.124l5.81-6.505.08-.102.005-.008a1 1 0 0 0-.166-1.295Z" clip-rule="evenodd"/></svg>`;

const ICON_DANMAKU_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="m8.085 4.891-.999-1.499a1.008 1.008 0 0 1 1.679-1.118l1.709 2.566c.54-.008 1.045-.012 1.515-.012h.13c.345 0 .707.003 1.088.007l1.862-2.59a1.008 1.008 0 0 1 1.637 1.177l-1.049 1.46c.788.02 1.631.046 2.53.078 1.958.069 3.468 1.6 3.74 3.507.088.613.13 2.158.16 3.276l.001.027c.01.333.017.63.025.856a.987.987 0 0 1-1.974.069c-.008-.23-.016-.539-.025-.881v-.002c-.028-1.103-.066-2.541-.142-3.065-.143-1.004-.895-1.78-1.854-1.813-2.444-.087-4.466-.13-6.064-.131-1.598 0-3.619.044-6.063.13a2.037 2.037 0 0 0-1.945 1.748c-.15 1.04-.225 2.341-.225 3.904 0 1.874.11 3.474.325 4.798.154.949.95 1.66 1.91 1.708a97.58 97.58 0 0 0 5.416.139.988.988 0 0 1 0 1.975c-2.196 0-3.61-.047-5.513-.141A4.012 4.012 0 0 1 2.197 17.7c-.236-1.446-.351-3.151-.351-5.116 0-1.64.08-3.035.245-4.184A4.013 4.013 0 0 1 5.92 4.96c.761-.027 1.483-.05 2.164-.069Zm4.436 4.707h-1.32v4.63h2.222v.848h-2.618v1.078h2.431a5.01 5.01 0 0 1 3.575-3.115V9.598h-1.276a8.59 8.59 0 0 0 .748-1.42l-1.089-.384a14.232 14.232 0 0 1-.814 1.804h-1.518l.693-.308a8.862 8.862 0 0 0-.814-1.408l-1.045.352c.297.396.572.847.825 1.364Zm-4.18 3.564.154-1.485h1.98V8.289h-3.2v.979h2.067v1.43H7.483l-.308 3.454h2.277c0 1.166-.044 1.925-.12 2.277-.078.352-.386.528-.936.528-.308 0-.616-.022-.902-.055l.297 1.067.062.004c.285.02.551.04.818.04 1.001-.066 1.562-.418 1.694-1.056.11-.638.176-1.903.176-3.795h-2.2Zm7.458.11v-.858h-1.254v.858H15.8Zm-2.376-.858v.858h-1.199v-.858h1.2Zm-1.199-.946h1.2v-.902h-1.2v.902Zm2.321 0v-.902H15.8v.902h-1.254Zm3.517 10.594a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-.002-1.502a2.5 2.5 0 0 1-2.217-3.657l3.326 3.398a2.49 2.49 0 0 1-1.109.259Zm2.5-2.5c0 .42-.103.815-.286 1.162l-3.328-3.401a2.5 2.5 0 0 1 3.614 2.239Z" clip-rule="evenodd"/></svg>`;

const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="m15.645 4.881 1.06-1.473a.998.998 0 1 0-1.622-1.166L13.22 4.835a110.67 110.67 0 0 0-1.1-.007h-.131c-.47 0-.975.004-1.515.012L8.783 2.3A.998.998 0 0 0 7.12 3.408l.988 1.484c-.688.019-1.418.042-2.188.069a4.013 4.013 0 0 0-3.83 3.44c-.165 1.15-.245 2.545-.245 4.185 0 1.965.115 3.67.35 5.116a4.012 4.012 0 0 0 3.763 3.363c1.903.094 3.317.141 5.513.141a.988.988 0 0 0 0-1.975 97.58 97.58 0 0 1-5.416-.139 2.037 2.037 0 0 1-1.91-1.708c-.216-1.324-.325-2.924-.325-4.798 0-1.563.076-2.864.225-3.904.14-.977.96-1.713 1.945-1.747 2.444-.087 4.465-.13 6.063-.131 1.598 0 3.62.044 6.064.13.96.034 1.71.81 1.855 1.814.075.524.113 1.962.141 3.065v.002c.005.183.01.07.014-.038.004-.096.008-.189.011-.081a.987.987 0 1 0 1.974-.069c-.004-.105-.007-.009-.011.09-.002.056-.004.112-.007.135l-.002.01a.574.574 0 0 1-.005-.091v-.027c-.03-1.118-.073-2.663-.16-3.276-.273-1.906-1.783-3.438-3.74-3.507-.905-.032-1.752-.058-2.543-.079Zm-3.113 4.703h-1.307v4.643h2.2v.04l.651-1.234c.113-.215.281-.389.482-.509v-.11h.235c.137-.049.283-.074.433-.074h1.553V9.584h-1.264a8.5 8.5 0 0 0 .741-1.405l-1.078-.381c-.24.631-.501 1.23-.806 1.786h-1.503l.686-.305c-.228-.501-.5-.959-.806-1.394l-1.034.348c.294.392.566.839.817 1.35Zm-1.7 5.502h2.16l-.564 1.068h-1.595v-1.068Zm-2.498-1.863.152-1.561h1.96V8.289H7.277v.969h2.048v1.435h-1.84l-.306 3.51h2.254c0 1.155-.043 1.906-.12 2.255-.076.348-.38.523-.925.523-.305 0-.61-.022-.893-.055l.294 1.056.061.005c.282.02.546.039.81.039.991-.065 1.547-.414 1.677-1.046.11-.631.175-1.883.175-3.757H8.334Zm5.09-.8v.85h-1.188v-.85h1.187Zm-1.188-.955h1.187v-.893h-1.187v.893Zm2.322.007v-.893h1.241v.893h-1.241Zm.528 2.757a1.26 1.26 0 0 1 1.087-.627l4.003-.009a1.26 1.26 0 0 1 1.094.63l1.721 2.982c.226.39.225.872-.001 1.263l-1.743 3a1.26 1.26 0 0 1-1.086.628l-4.003.009a1.26 1.26 0 0 1-1.094-.63l-1.722-2.982a1.26 1.26 0 0 1 .002-1.263l1.742-3Zm1.967.858a1.26 1.26 0 0 0-1.08.614l-.903 1.513a1.26 1.26 0 0 0-.002 1.289l.885 1.492c.227.384.64.62 1.086.618l2.192-.005a1.26 1.26 0 0 0 1.08-.615l.904-1.518a1.26 1.26 0 0 0 .001-1.288l-.884-1.489a1.26 1.26 0 0 0-1.086-.616l-2.193.005Zm2.517 2.76a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z" clip-rule="evenodd"/></svg>`;

const ICON_COPY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;

const ICON_SPEECH_ON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;

const ICON_SPEECH_MUTE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>`;

const ICON_SPEECH_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>`;

const ICON_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14v-2H5v2zm7-18v10.17l3.59-3.58L17 10l-5 5-5-5 1.41-1.41L11 12.17V2h1z"/></svg>`;

class SettingsPanel {
  constructor({ settings, onChange, onClose }) {
    this.settings = settings;
    this.onChange = onChange;
    this.onClose = onClose;
    this.balloon = null;
    this.anchor = null;
    this.isOpen = false;
    this.boundReposition = () => this.reposition();
    this.boundOutsideClick = (e) => this.handleOutsideClick(e);
  }

  toggle(anchor) {
    if (this.isOpen && this.anchor === anchor) this.close();
    else this.open(anchor);
  }

  open(anchor) {
    this.close();
    this.anchor = anchor;
    this.isOpen = true;
    this.render();
    this.reposition();
    requestAnimationFrame(() => this.reposition());

    window.addEventListener('resize', this.boundReposition);
    document.addEventListener('fullscreenchange', this.boundReposition);
    document.addEventListener('webkitfullscreenchange', this.boundReposition);
    document.addEventListener('scroll', this.boundReposition, true);
    setTimeout(() => document.addEventListener('click', this.boundOutsideClick, true), 0);
  }

  close() {
    const wasOpen = this.isOpen;
    this.isOpen = false;
    this.anchor = null;
    this.balloon?.remove();
    this.balloon = null;

    window.removeEventListener('resize', this.boundReposition);
    document.removeEventListener('fullscreenchange', this.boundReposition);
    document.removeEventListener('webkitfullscreenchange', this.boundReposition);
    document.removeEventListener('scroll', this.boundReposition, true);
    document.removeEventListener('click', this.boundOutsideClick, true);
    if (wasOpen) this.onClose?.();
  }

  handleOutsideClick(e) {
    if (!this.balloon || !this.isOpen) return;
    if (this.balloon.contains(e.target)) return;
    if (this.anchor?.contains(e.target)) return;
    this.close();
  }

  reposition() {
    if (!this.balloon || !this.anchor) return;

    const mountTarget = getFullscreenElement() || document.body;
    if (this.balloon.parentElement !== mountTarget) {
      mountTarget.appendChild(this.balloon);
    }

    const rect = this.anchor.getBoundingClientRect();
    const width = 300;
    const gap = 8;
    const height = this.balloon.offsetHeight;
    let left = rect.right - width;
    let top = rect.top - height - gap;

    left = clamp(left, 8, window.innerWidth - width - 8);
    if (top < 8) top = rect.bottom + gap;

    Object.assign(this.balloon.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      zIndex: '100000',
    });
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    saveSettings(this.settings);
    this.onChange(this.settings);
  }

  createToggle(label, key) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--toggle';

    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const switchWrap = document.createElement('label');
    switchWrap.className = 'ydm-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!this.settings[key];

    const slider = document.createElement('span');
    slider.className = 'ydm-switch-slider';

    input.addEventListener('change', () => {
      this.updateSetting(key, input.checked);
    });

    switchWrap.append(input, slider);
    row.append(labelEl, switchWrap);
    return row;
  }

  createRange(label, key, min, max, step, format) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-field-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'ydm-balloon-value';
    valueSpan.textContent = format(this.settings[key]);

    header.append(labelEl, valueSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'ydm-balloon-range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(this.settings[key]);
    input.addEventListener('input', () => {
      const val = Number(input.value);
      valueSpan.textContent = format(val);
      this.updateSetting(key, val);
    });

    row.append(header, input);
    return row;
  }

  createSelect(label, key, options) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const labelEl = document.createElement('div');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const select = document.createElement('select');
    select.className = 'ydm-balloon-select';
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === this.settings[key]) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => {
      this.updateSetting(key, select.value);
    });

    row.append(labelEl, select);
    return row;
  }

  render() {
    this.balloon = document.createElement('div');
    this.balloon.className = 'ydm-balloon';
    this.balloon.setAttribute('role', 'dialog');
    this.balloon.setAttribute('aria-label', t('panelTitle'));
    this.balloon.addEventListener('click', (e) => e.stopPropagation());
    this.balloon.addEventListener('pointerdown', (e) => e.stopPropagation());

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';

    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('panelTitle');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-balloon-close';
    closeBtn.setAttribute('aria-label', t('panelClose'));
    closeBtn.textContent = t('panelClose');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'ydm-balloon-body';
    body.append(
      this.createRange(t('scrollSpeed'), 'speed', 1, 10, 1, (v) => String(v)),
      this.createRange(t('fontSize'), 'fontSize', 14, 40, 1, (v) => `${v}px`),
      this.createRange(t('danmakuOpacity'), 'opacity', 10, 100, 5, (v) => `${v}%`),
      this.createSelect(t('fontFamily'), 'fontFamily', getFontOptions()),
      this.createSelect(t('scrollArea'), 'scrollArea', getScrollAreaOptions()),
      this.createDivider(),
      this.createToggle(t('superchatPinned'), 'superchatPinned'),
      this.createSelect(t('superchatPosition'), 'superchatPosition', getSuperchatPositionOptions()),
      this.createRange(t('superchatDuration'), 'superchatDuration', 2, 15, 1, (v) => `${v} ${t('speechSeconds')}`),
      this.createSelect(t('superchatAnimation'), 'superchatAnimation', getSuperchatAnimationOptions()),
      this.createDivider(),
      this.createKeywordBlock(),
      this.createDivider(),
      this.createToggle(t('translateEnable'), 'translateEnabled'),
      this.createSelect(t('translateProvider'), 'translateProvider', getTranslateProviderOptions()),
      this.createSelect(t('translateTarget'), 'translateTargetLang', getTranslateLangOptions()),
      this.createRange(t('translateSpeed'), 'translateSpeed', 1, 10, 1, (v) => `${v} ${t('translateSpeedUnit')}`),
    );

    this.balloon.append(header, body);
    const mountTarget = getFullscreenElement() || document.body;
    mountTarget.appendChild(this.balloon);
  }

  createKeywordBlock() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const label = document.createElement('div');
    label.className = 'ydm-balloon-label';
    label.textContent = t('blockKeywords');

    const hint = document.createElement('div');
    hint.className = 'ydm-keyword-hint';
    hint.textContent = t('blockKeywordHint');

    const form = document.createElement('div');
    form.className = 'ydm-keyword-add';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-balloon-input';
    input.maxLength = 40;
    input.placeholder = t('blockKeywordPlaceholder');
    input.setAttribute('aria-label', t('blockKeywords'));

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ydm-keyword-add-btn';
    addBtn.textContent = t('blockKeywordAdd');

    const list = document.createElement('div');
    list.className = 'ydm-keyword-list';

    const renderList = () => {
      list.replaceChildren();
      for (const word of this.settings.blockKeywords || []) {
        const chip = document.createElement('span');
        chip.className = 'ydm-keyword-chip';

        const text = document.createElement('span');
        text.textContent = word;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'ydm-keyword-remove';
        remove.setAttribute('aria-label', `${t('blockKeywordRemove')} ${word}`);
        remove.textContent = '×';
        remove.addEventListener('click', (e) => {
          e.stopPropagation();
          const next = (this.settings.blockKeywords || []).filter((item) => item !== word);
          this.updateSetting('blockKeywords', next);
          renderList();
        });

        chip.append(text, remove);
        list.appendChild(chip);
      }
    };

    const addWord = () => {
      const word = input.value.trim().slice(0, 40);
      if (!word) return;
      const current = this.settings.blockKeywords || [];
      if (current.some((item) => item.toLowerCase() === word.toLowerCase())) {
        input.value = '';
        return;
      }
      if (current.length >= 50) return;
      this.updateSetting('blockKeywords', [...current, word]);
      input.value = '';
      renderList();
    };

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addWord();
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Enter') return;
      e.preventDefault();
      addWord();
    });

    form.append(input, addBtn);
    row.append(label, hint, form, list);
    renderList();
    return row;
  }

  createDivider() {
    const div = document.createElement('div');
    div.className = 'ydm-balloon-divider';
    return div;
  }
}

class SpeechPanel {
  constructor({ settings, onChange, onClose }) {
    this.settings = settings;
    this.onChange = onChange;
    this.onClose = onClose;
    this.balloon = null;
    this.anchor = null;
    this.isOpen = false;
    this.langSelect = null;
    this.voiceSelect = null;
    this.boundReposition = () => this.reposition();
    this.boundOutsideClick = (e) => this.handleOutsideClick(e);
    this.boundVoices = () => this.fillVoices();
  }

  toggle(anchor) {
    if (this.isOpen && this.anchor === anchor) this.close();
    else this.open(anchor);
  }

  open(anchor) {
    this.close();
    this.anchor = anchor;
    this.isOpen = true;
    this.render();
    this.reposition();
    requestAnimationFrame(() => this.reposition());
    window.speechSynthesis?.addEventListener('voiceschanged', this.boundVoices);

    window.addEventListener('resize', this.boundReposition);
    document.addEventListener('fullscreenchange', this.boundReposition);
    document.addEventListener('webkitfullscreenchange', this.boundReposition);
    document.addEventListener('scroll', this.boundReposition, true);
    setTimeout(() => document.addEventListener('click', this.boundOutsideClick, true), 0);
  }

  close() {
    const wasOpen = this.isOpen;
    this.isOpen = false;
    this.anchor = null;
    this.balloon?.remove();
    this.balloon = null;
    this.langSelect = null;
    this.voiceSelect = null;
    window.speechSynthesis?.removeEventListener('voiceschanged', this.boundVoices);
    window.removeEventListener('resize', this.boundReposition);
    document.removeEventListener('fullscreenchange', this.boundReposition);
    document.removeEventListener('webkitfullscreenchange', this.boundReposition);
    document.removeEventListener('scroll', this.boundReposition, true);
    document.removeEventListener('click', this.boundOutsideClick, true);
    if (wasOpen) this.onClose?.();
  }

  handleOutsideClick(e) {
    if (!this.balloon || !this.isOpen) return;
    if (this.balloon.contains(e.target)) return;
    if (this.anchor?.contains(e.target)) return;
    this.close();
  }

  reposition() {
    if (!this.balloon || !this.anchor) return;

    const mountTarget = getFullscreenElement() || document.body;
    if (this.balloon.parentElement !== mountTarget) {
      mountTarget.appendChild(this.balloon);
    }

    const rect = this.anchor.getBoundingClientRect();
    const width = 320;
    const gap = 8;
    const height = this.balloon.offsetHeight;
    let left = rect.right - width;
    let top = rect.top - height - gap;

    left = clamp(left, 8, window.innerWidth - width - 8);
    if (top < 8) top = rect.bottom + gap;

    Object.assign(this.balloon.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      zIndex: '100000',
    });
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    saveSettings(this.settings);
    this.onChange(this.settings);
    if ((key === 'speechEnabled' && !value) || (key === 'speechVolume' && Number(value) <= 0)) {
      cancelSpeech();
    }
  }

  createToggle(label, key) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--toggle';

    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;

    const switchWrap = document.createElement('label');
    switchWrap.className = 'ydm-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!this.settings[key];

    const slider = document.createElement('span');
    slider.className = 'ydm-switch-slider';

    input.addEventListener('change', () => {
      this.updateSetting(key, input.checked);
    });

    switchWrap.append(input, slider);
    row.append(labelEl, switchWrap);
    return row;
  }

  render() {
    this.balloon = document.createElement('div');
    this.balloon.className = 'ydm-balloon ydm-speech-panel';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';

    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('speechPanelTitle');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-balloon-close';
    closeBtn.textContent = t('panelClose');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'ydm-balloon-body ydm-balloon-body--speech';

    if (!speechSupported()) {
      const note = document.createElement('p');
      note.className = 'ydm-speech-note';
      note.textContent = t('speechUnsupported');
      body.appendChild(note);
      this.balloon.append(header, body);
      (getFullscreenElement() || document.body).appendChild(this.balloon);
      return;
    }

    body.append(
      this.createToggle(t('speechEnable'), 'speechEnabled'),
      this.createTest(),
      this.createDivider(),
      this.createRange(t('speechVolume'), 'speechVolume', 0, 100, 5, (v) => `${v}%`),
      this.createRange(t('speechPitch'), 'speechPitch', 0, 200, 10, (v) => `${v}%`),
      this.createVoices(),
      this.createDivider(),
      this.createRange(t('speechRate'), 'speechRate', 50, 200, 10, (v) => `${v}%`),
      this.createToggle(t('speechPace'), 'speechPace'),
      this.createRange(t('speechMaxSeconds'), 'speechMaxSeconds', 1, 15, 1, (v) => `${v} ${t('speechSeconds')}`),
      this.createHint(t('speechPaceHint')),
      this.createDivider(),
      this.createRange(t('speechBuffer'), 'speechBuffer', 1, 25, 1, (v) => String(v)),
      this.createHint(t('speechBufferHint')),
    );

    this.balloon.append(header, body);
    this.balloon.addEventListener('click', (e) => e.stopPropagation());
    this.balloon.addEventListener('pointerdown', (e) => e.stopPropagation());
    (getFullscreenElement() || document.body).appendChild(this.balloon);
    this.fillVoices();
  }

  createTest() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const label = document.createElement('span');
    label.className = 'ydm-balloon-label';
    label.textContent = t('speechTest');

    const controls = document.createElement('div');
    controls.className = 'ydm-speech-test';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-balloon-input';
    input.value = t('speechTestText');

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'ydm-speech-play';
    play.textContent = '▶';
    play.setAttribute('aria-label', t('speechPlay'));
    play.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      previewSpeech(input.value, false);
    });

    const fast = document.createElement('button');
    fast.type = 'button';
    fast.className = 'ydm-speech-play';
    fast.textContent = '▶▶';
    fast.setAttribute('aria-label', t('speechPlayFast'));
    fast.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      previewSpeech(input.value, true);
    });

    controls.append(input, play, fast);
    row.append(label, controls);
    return row;
  }

  createVoices() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const langLabel = document.createElement('span');
    langLabel.className = 'ydm-balloon-label';
    langLabel.textContent = t('speechVoiceLang');

    this.langSelect = document.createElement('select');
    this.langSelect.className = 'ydm-balloon-select';
    this.langSelect.addEventListener('change', () => {
      const lang = this.langSelect.value;
      this.updateSetting('speechLang', lang);
      const voices = this.voicesForLang(lang);
      const next = voices[0]?.voiceURI || '';
      this.updateSetting('speechVoice', next);
      this.fillVoices();
    });

    const voiceLabel = document.createElement('span');
    voiceLabel.className = 'ydm-balloon-label';
    voiceLabel.textContent = t('speechVoice');

    this.voiceSelect = document.createElement('select');
    this.voiceSelect.className = 'ydm-balloon-select';
    this.voiceSelect.addEventListener('change', () => {
      this.updateSetting('speechVoice', this.voiceSelect.value);
    });

    row.append(langLabel, this.langSelect, voiceLabel, this.voiceSelect);
    return row;
  }

  voicesForLang(lang) {
    const voices = listSpeechVoices();
    if (!lang) return voices;
    const wanted = lang.toLowerCase();
    return voices.filter((voice) => voice.lang.toLowerCase() === wanted);
  }

  fillVoices() {
    if (!this.langSelect || !this.voiceSelect) return;
    const voices = listSpeechVoices();
    const langs = [];
    for (const voice of voices) {
      if (voice.lang && !langs.includes(voice.lang)) langs.push(voice.lang);
    }
    langs.sort();

    const lang = this.settings.speechLang || '';
    this.langSelect.replaceChildren();
    this.langSelect.appendChild(new Option(t('speechVoiceDefault'), ''));
    for (const code of langs) {
      this.langSelect.appendChild(new Option(code, code));
    }
    this.langSelect.value = langs.includes(lang) ? lang : '';

    const visible = this.voicesForLang(this.langSelect.value);
    this.voiceSelect.replaceChildren();
    this.voiceSelect.appendChild(new Option(t('speechVoiceDefault'), ''));
    for (const voice of visible) {
      const option = new Option(`${voice.name} (${voice.lang})`, voice.voiceURI);
      this.voiceSelect.appendChild(option);
    }
    const selected = this.settings.speechVoice || '';
    this.voiceSelect.value = [...this.voiceSelect.options].some((option) => option.value === selected) ? selected : '';
  }

  createRange(label, key, min, max, step, format) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-field-header';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.className = 'ydm-balloon-value';
    valueSpan.textContent = format(this.settings[key]);
    header.append(labelEl, valueSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'ydm-balloon-range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(this.settings[key]);
    input.addEventListener('input', () => {
      const val = Number(input.value);
      valueSpan.textContent = format(val);
      this.updateSetting(key, val);
    });

    row.append(header, input);
    return row;
  }

  createSection(text) {
    const el = document.createElement('div');
    el.className = 'ydm-balloon-section';
    el.textContent = text;
    return el;
  }

  createHint(text) {
    const el = document.createElement('p');
    el.className = 'ydm-speech-note';
    el.textContent = text;
    return el;
  }

  createDivider() {
    const el = document.createElement('div');
    el.className = 'ydm-balloon-divider';
    return el;
  }
}

class HistoryPanel {
  constructor({ onClose }) {
    this.onClose = onClose;
    this.balloon = null;
    this.anchor = null;
    this.isOpen = false;
    this.busy = false;
    this.abort = false;
    this.paused = false;
    this.progressCount = 0;
    this.keywords = '';
    this.usernames = '';
    this.includeSuperchat = true;
    this.format = 'json';
    this.startSec = 0;
    this.endSec = 0;
    this.statusEl = null;
    this.downloadBtn = null;
    this.pauseBtn = null;
    this.resumeBtn = null;
    this.cancelBtn = null;
    this.boundReposition = () => this.reposition();
    this.boundOutsideClick = (e) => this.handleOutsideClick(e);
  }

  toggle(anchor) {
    if (this.isOpen && this.anchor === anchor) this.close();
    else this.open(anchor);
  }

  open(anchor) {
    this.close();
    this.anchor = anchor;
    this.isOpen = true;
    const duration = currentDurationSeconds();
    if (!this.endSec || this.endSec > duration) this.endSec = duration;
    this.render();
    this.reposition();
    requestAnimationFrame(() => this.reposition());
    window.addEventListener('resize', this.boundReposition);
    document.addEventListener('fullscreenchange', this.boundReposition);
    document.addEventListener('webkitfullscreenchange', this.boundReposition);
    document.addEventListener('scroll', this.boundReposition, true);
    setTimeout(() => document.addEventListener('click', this.boundOutsideClick, true), 0);
  }

  close() {
    const wasOpen = this.isOpen;
    this.abort = true;
    this.paused = false;
    this.busy = false;
    this.isOpen = false;
    this.anchor = null;
    this.balloon?.remove();
    this.balloon = null;
    this.statusEl = null;
    this.downloadBtn = null;
    this.pauseBtn = null;
    this.resumeBtn = null;
    this.cancelBtn = null;
    window.removeEventListener('resize', this.boundReposition);
    document.removeEventListener('fullscreenchange', this.boundReposition);
    document.removeEventListener('webkitfullscreenchange', this.boundReposition);
    document.removeEventListener('scroll', this.boundReposition, true);
    document.removeEventListener('click', this.boundOutsideClick, true);
    if (wasOpen) this.onClose?.();
  }

  handleOutsideClick(e) {
    if (!this.balloon || !this.isOpen) return;
    if (this.balloon.contains(e.target)) return;
    if (this.anchor?.contains(e.target)) return;
    this.close();
  }

  reposition() {
    if (!this.balloon || !this.anchor) return;
    const mountTarget = getFullscreenElement() || document.body;
    if (this.balloon.parentElement !== mountTarget) mountTarget.appendChild(this.balloon);
    const rect = this.anchor.getBoundingClientRect();
    const width = 340;
    const gap = 8;
    const height = this.balloon.offsetHeight;
    let left = rect.right - width;
    let top = rect.top - height - gap;
    left = clamp(left, 8, window.innerWidth - width - 8);
    if (top < 8) top = rect.bottom + gap;
    Object.assign(this.balloon.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      zIndex: '100000',
    });
  }

  setStatus(text, isError) {
    if (!this.statusEl) return;
    this.statusEl.textContent = text;
    this.statusEl.classList.toggle('ydm-history-status--error', !!isError);
  }

  setProgressStatus() {
    const count = this.progressCount;
    if (this.paused) {
      this.setStatus(
        count > 0 ? `${t('historyPaused')} · ${t('historyProgress')} ${count}` : t('historyPaused'),
        false,
      );
      return;
    }
    this.setStatus(
      count > 0 ? `${t('historyProgress')} ${count}` : t('historyDownloading'),
      false,
    );
  }

  updateActionButtons() {
    const downloading = this.busy && !this.paused;
    const paused = this.busy && this.paused;
    if (this.downloadBtn) this.downloadBtn.hidden = this.busy;
    if (this.pauseBtn) this.pauseBtn.hidden = !downloading;
    if (this.resumeBtn) this.resumeBtn.hidden = !paused;
    if (this.cancelBtn) this.cancelBtn.hidden = !this.busy;
  }

  pauseDownload() {
    if (!this.busy || this.paused || this.abort) return;
    this.paused = true;
    this.setProgressStatus();
    this.updateActionButtons();
  }

  resumeDownload() {
    if (!this.busy || !this.paused || this.abort) return;
    this.paused = false;
    this.setProgressStatus();
    this.updateActionButtons();
  }

  cancelDownload() {
    if (!this.busy || this.abort) return;
    this.abort = true;
    this.paused = false;
    this.setStatus(t('historyCancelled'), false);
    this.updateActionButtons();
  }

  render() {
    this.balloon = document.createElement('div');
    this.balloon.className = 'ydm-balloon ydm-history-panel';

    const header = document.createElement('div');
    header.className = 'ydm-balloon-header';
    const title = document.createElement('div');
    title.className = 'ydm-balloon-title';
    title.textContent = t('historyPanelTitle');
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ydm-balloon-close';
    closeBtn.textContent = t('panelClose');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'ydm-balloon-body ydm-balloon-body--speech';
    const hint = document.createElement('p');
    hint.className = 'ydm-speech-note';
    hint.textContent = t('historyHint');

    body.append(
      hint,
      this.createField(t('historyKeywords'), t('historyKeywordsHint'), 'keywords'),
      this.createField(t('historyUsernames'), t('historyUsernamesHint'), 'usernames'),
      this.createSuperchatToggle(),
      this.createTimeRange(),
      this.createFormat(),
    );

    this.statusEl = document.createElement('p');
    this.statusEl.className = 'ydm-history-status';

    const actions = document.createElement('div');
    actions.className = 'ydm-history-actions';

    this.downloadBtn = document.createElement('button');
    this.downloadBtn.type = 'button';
    this.downloadBtn.className = 'ydm-history-download';
    this.downloadBtn.textContent = t('historyDownload');
    this.downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDownload();
    });

    this.pauseBtn = document.createElement('button');
    this.pauseBtn.type = 'button';
    this.pauseBtn.className = 'ydm-history-pause';
    this.pauseBtn.textContent = t('historyPause');
    this.pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.pauseDownload();
    });

    this.resumeBtn = document.createElement('button');
    this.resumeBtn.type = 'button';
    this.resumeBtn.className = 'ydm-history-resume';
    this.resumeBtn.textContent = t('historyResume');
    this.resumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.resumeDownload();
    });

    this.cancelBtn = document.createElement('button');
    this.cancelBtn.type = 'button';
    this.cancelBtn.className = 'ydm-history-cancel';
    this.cancelBtn.textContent = t('historyCancel');
    this.cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelDownload();
    });

    actions.append(this.downloadBtn, this.pauseBtn, this.resumeBtn, this.cancelBtn);
    body.append(this.statusEl, actions);
    this.updateActionButtons();

    this.balloon.append(header, body);
    this.balloon.addEventListener('click', (e) => e.stopPropagation());
    this.balloon.addEventListener('pointerdown', (e) => e.stopPropagation());
    (getFullscreenElement() || document.body).appendChild(this.balloon);
  }

  createField(label, placeholder, key) {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ydm-balloon-input';
    input.placeholder = placeholder;
    input.value = this[key];
    input.addEventListener('input', () => {
      this[key] = input.value;
    });
    row.append(labelEl, input);
    return row;
  }

  createSuperchatToggle() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--toggle';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = t('historySuperchat');
    const switchWrap = document.createElement('label');
    switchWrap.className = 'ydm-switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.includeSuperchat;
    const slider = document.createElement('span');
    slider.className = 'ydm-switch-slider';
    input.addEventListener('change', () => {
      this.includeSuperchat = input.checked;
    });
    switchWrap.append(input, slider);
    row.append(labelEl, switchWrap);
    return row;
  }

  createTimeRange() {
    const duration = currentDurationSeconds();
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = t('historyRange');
    row.appendChild(labelEl);
    if (!duration) {
      const note = document.createElement('p');
      note.className = 'ydm-speech-note';
      note.textContent = t('historyNoDuration');
      row.appendChild(note);
      return row;
    }
    if (!this.endSec) this.endSec = duration;
    const value = document.createElement('span');
    value.className = 'ydm-balloon-value';
    const updateLabel = () => {
      value.textContent = `${formatHistoryRangeLabel(this.startSec)} – ${formatHistoryRangeLabel(this.endSec)}`;
    };
    updateLabel();
    const header = document.createElement('div');
    header.className = 'ydm-balloon-field-header';
    header.append(labelEl, value);

    const start = this.createRangeInput(0, duration, this.startSec, (next) => {
      this.startSec = Math.min(next, this.endSec);
      start.value = String(this.startSec);
      updateLabel();
    });
    const end = this.createRangeInput(0, duration, this.endSec, (next) => {
      this.endSec = Math.max(next, this.startSec);
      end.value = String(this.endSec);
      updateLabel();
    });
    row.replaceChildren(header, start, end);
    return row;
  }

  createRangeInput(min, max, value, onInput) {
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'ydm-balloon-range';
    input.min = String(min);
    input.max = String(Math.max(min, Math.floor(max)));
    input.step = '1';
    input.value = String(Math.floor(value));
    input.addEventListener('input', () => onInput(Number(input.value)));
    return input;
  }

  createFormat() {
    const row = document.createElement('div');
    row.className = 'ydm-balloon-row ydm-balloon-row--field';
    const labelEl = document.createElement('span');
    labelEl.className = 'ydm-balloon-label';
    labelEl.textContent = t('historyFormat');
    const select = document.createElement('select');
    select.className = 'ydm-balloon-select';
    for (const format of ['json', 'csv', 'txt']) {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = format.toUpperCase();
      if (format === this.format) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => {
      this.format = select.value;
    });
    row.append(labelEl, select);
    return row;
  }

  async startDownload() {
    if (this.busy) return;
    this.busy = true;
    this.abort = false;
    this.paused = false;
    this.progressCount = 0;
    this.updateActionButtons();
    this.setStatus(t('historyDownloading'), false);
    const duration = currentDurationSeconds();
    const startMs = duration ? this.startSec * 1000 : 0;
    const endMs = duration ? this.endSec * 1000 : Infinity;
    try {
      const fetched = await fetchLiveChatHistory({
        startMs,
        endMs,
        shouldAbort: () => this.abort || !this.isOpen,
        shouldPause: () => this.paused && this.isOpen && !this.abort,
        onProgress: (count) => {
          this.progressCount = count;
          if (!this.abort && this.isOpen) this.setProgressStatus();
        },
      });
      if (this.abort || !this.isOpen) {
        if (this.isOpen && this.abort) this.setStatus(t('historyCancelled'), false);
        return;
      }
      const filtered = filterLiveChatHistory(fetched, {
        keywords: this.keywords,
        usernames: this.usernames,
        includeSuperchat: this.includeSuperchat,
      });
      if (!filtered.length) {
        this.setStatus(fetched.length ? t('historyEmpty') : t('historyNone'), true);
        return;
      }
      downloadLiveChatFile(filtered, this.format, currentVideoId());
      this.setStatus(`${t('historyDone')} ${filtered.length}`, false);
    } catch (err) {
      if (this.abort || err?.code === 'aborted') {
        if (this.isOpen) this.setStatus(t('historyCancelled'), false);
        return;
      }
      this.setStatus(err?.code === 'no-history' ? t('historyNone') : t('historyFailed'), true);
    } finally {
      this.busy = false;
      this.paused = false;
      this.abort = false;
      this.updateActionButtons();
    }
  }
}

class ControlButton {
  constructor({ onToggleDanmaku, onTogglePanel, onToggleSpeech, onToggleHistory, getSettings, isPanelOpen, isSpeechPanelOpen, isHistoryPanelOpen }) {
    this.onToggleDanmaku = onToggleDanmaku;
    this.onTogglePanel = onTogglePanel;
    this.onToggleSpeech = onToggleSpeech;
    this.onToggleHistory = onToggleHistory;
    this.getSettings = getSettings;
    this.isPanelOpen = isPanelOpen;
    this.isSpeechPanelOpen = isSpeechPanelOpen;
    this.isHistoryPanelOpen = isHistoryPanelOpen;
    this.wrap = null;
    this.danmakuBtn = null;
    this.speechBtn = null;
    this.historyBtn = null;
    this.settingsBtn = null;
    this.controlsGroup = null;
    this.mounting = false;
  }

  createBtn(className, label, html) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ydm-control-btn ${className}`;
    btn.setAttribute('aria-label', label);
    appendMarkup(btn, html);
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    return btn;
  }

  async mount() {
    if (this.mounting || this.wrap?.isConnected) return;
    this.mounting = true;

    try {
      this.controlsGroup = await waitForElement(SELECTORS.playerControls, document, 15000);
      if (!this.controlsGroup || this.wrap?.isConnected) return;
      if (this.controlsGroup.querySelector('.ydm-controls-wrap')) return;

      this.wrap = document.createElement('div');
      this.wrap.className = 'ydm-controls-wrap';

      this.danmakuBtn = this.createBtn('ydm-danmaku-btn', t('danmakuToggle'), `
        <span class="ydm-icon ydm-icon-on">${ICON_DANMAKU_ON}</span>
        <span class="ydm-icon ydm-icon-off">${ICON_DANMAKU_OFF}</span>
      `);
      this.danmakuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onToggleDanmaku();
      });

      this.speechBtn = this.createBtn('ydm-speech-btn', t('speechToggle'), `
        <span class="ydm-icon ydm-icon-on">${ICON_SPEECH_ON}</span>
        <span class="ydm-icon ydm-icon-mute">${ICON_SPEECH_MUTE}</span>
        <span class="ydm-icon ydm-icon-off">${ICON_SPEECH_OFF}</span>
      `);
      this.speechBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onToggleSpeech(this.speechBtn);
      });

      this.historyBtn = this.createBtn('ydm-history-btn', t('historyToggle'), ICON_DOWNLOAD);
      this.historyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onToggleHistory(this.historyBtn);
      });

      this.settingsBtn = this.createBtn('ydm-settings-btn', t('settingsToggle'), ICON_SETTINGS);
      this.settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onTogglePanel(this.settingsBtn);
      });

      this.wrap.append(this.danmakuBtn, this.settingsBtn, this.speechBtn, this.historyBtn);
      const first = this.controlsGroup.firstChild;
      if (first) this.controlsGroup.insertBefore(this.wrap, first);
      else this.controlsGroup.appendChild(this.wrap);

      this.updateDanmakuState();
      this.updateSpeechState();
      this.updateHistoryState();
      this.updatePanelState();
    } finally {
      this.mounting = false;
    }
  }

  remount() {
    if (this.wrap?.isConnected) return;
    const existing = document.querySelector('.ydm-controls-wrap');
    if (existing?.isConnected && existing.querySelector('.ydm-danmaku-btn') && existing.querySelector('.ydm-speech-btn') && existing.querySelector('.ydm-history-btn')) {
      this.wrap = existing;
      this.danmakuBtn = existing.querySelector('.ydm-danmaku-btn');
      this.speechBtn = existing.querySelector('.ydm-speech-btn');
      this.historyBtn = existing.querySelector('.ydm-history-btn');
      this.settingsBtn = existing.querySelector('.ydm-settings-btn');
      this.updateSpeechState();
      this.updateHistoryState();
      return;
    }
    existing?.remove();
    this.wrap = null;
    this.danmakuBtn = null;
    this.speechBtn = null;
    this.historyBtn = null;
    this.settingsBtn = null;
    this.mount();
  }

  updateDanmakuState() {
    if (!this.danmakuBtn) return;
    const enabled = this.getSettings().enabled;
    this.danmakuBtn.classList.toggle('ydm-danmaku-enabled', enabled);
    this.danmakuBtn.classList.toggle('ydm-danmaku-disabled', !enabled);
    this.danmakuBtn.title = enabled ? t('danmakuOn') : t('danmakuOff');
    this.danmakuBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  updateSpeechState() {
    if (!this.speechBtn) return;
    const settings = this.getSettings();
    const enabled = !!settings.speechEnabled;
    const muted = enabled && Number(settings.speechVolume) <= 0;
    const current = !enabled ? 'off' : muted ? 'mute' : 'on';
    this.speechBtn.classList.toggle('ydm-speech-on', current === 'on');
    this.speechBtn.classList.toggle('ydm-speech-mute', current === 'mute');
    this.speechBtn.classList.toggle('ydm-speech-off', current === 'off');
    this.speechBtn.classList.toggle('ydm-active', !!this.isSpeechPanelOpen?.());
    const label = current === 'on' ? t('speechOn') : current === 'mute' ? t('speechMute') : t('speechOff');
    this.speechBtn.title = label;
    this.speechBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    this.speechBtn.setAttribute('aria-expanded', this.isSpeechPanelOpen?.() ? 'true' : 'false');
  }

  updateHistoryState() {
    if (!this.historyBtn) return;
    const open = !!this.isHistoryPanelOpen?.();
    this.historyBtn.classList.toggle('ydm-active', open);
    this.historyBtn.title = t('historyToggle');
    this.historyBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  updatePanelState() {
    if (!this.settingsBtn) return;
    this.settingsBtn.classList.toggle('ydm-active', this.isPanelOpen());
    this.settingsBtn.setAttribute('aria-expanded', this.isPanelOpen() ? 'true' : 'false');
    this.updateSpeechState();
    this.updateHistoryState();
  }

  destroy() {
    this.wrap?.remove();
    this.wrap = null;
    this.danmakuBtn = null;
    this.speechBtn = null;
    this.historyBtn = null;
    this.settingsBtn = null;
    this.mounting = false;
  }
}

let settings = loadSettings();
let danmaku = null;
let danmakuEmitter = null;
let translateQueue = null;
let chatObserver = null;
let settingsPanel = null;
let speechPanel = null;
let historyPanel = null;
let controlButton = null;
let stylesInjected = false;
let pageActive = isPageActive();
let generation = 0;
let navKey = null;
let reconciling = false;

function getSettings() {
  return settings;
}

function isActive() {
  if (!isWatchPage()) return false;
  if (document.documentElement.dataset.ydmPreview === 'true') return true;
  return pageActive;
}

function onSettingsChange(newSettings) {
  settings = newSettings;
  danmaku?.updateLayout();
  controlButton?.updateDanmakuState();
  controlButton?.updateSpeechState();
  if (!settings.translateEnabled) translateQueue?.clear();
}

function toggleDanmaku() {
  settings.enabled = !settings.enabled;
  saveSettings(settings);
  onSettingsChange(settings);
}

function handleVisibilityChange() {
  const wasActive = pageActive;
  pageActive = isPageActive();
  if (wasActive && !pageActive) {
    danmakuEmitter?.clear();
    translateQueue?.clear();
    cancelSpeech();
  }
}

function teardown() {
  generation += 1;
  chatObserver?.stop();
  danmaku?.destroy();
  controlButton?.destroy();
  danmakuEmitter?.clear();
  translateQueue?.clear();
  settingsPanel?.close();
  speechPanel?.close();
  historyPanel?.close();
  cancelSpeech();
  chatObserver = null;
  danmaku = null;
  danmakuEmitter = null;
  translateQueue = null;
  controlButton = null;
}

async function boot() {
  if (!isWatchPage()) return;
  const gen = ++generation;
  settings = loadSettings();
  pageActive = isPageActive();

  if (!stylesInjected) {
    injectStyles();
    stylesInjected = true;
  }

  ensureSpeechSpeaker(getSettings);

  const engine = new DanmakuEngine(getSettings);
  const emitter = new DanmakuEmitter(engine, getSettings, isActive);
  const queue = new TranslateQueue(getSettings, isActive);
  const observer = new ChatObserver({
    getSettings,
    danmakuEmitter: emitter,
    translateQueue: queue,
    isActive,
  });

  if (!settingsPanel) {
    settingsPanel = new SettingsPanel({
      settings,
      onChange: onSettingsChange,
      onClose: () => controlButton?.updatePanelState(),
    });
  } else {
    settingsPanel.settings = settings;
  }

  if (!speechPanel) {
    speechPanel = new SpeechPanel({
      settings,
      onChange: onSettingsChange,
      onClose: () => controlButton?.updateSpeechState(),
    });
  } else {
    speechPanel.settings = settings;
  }

  if (!historyPanel) {
    historyPanel = new HistoryPanel({
      onClose: () => controlButton?.updateHistoryState(),
    });
  }

  const controls = new ControlButton({
    onToggleDanmaku: toggleDanmaku,
    onTogglePanel: (anchor) => {
      speechPanel.close();
      historyPanel.close();
      settingsPanel.toggle(anchor);
      controls.updatePanelState();
    },
    onToggleSpeech: (anchor) => {
      settingsPanel.close();
      historyPanel.close();
      speechPanel.toggle(anchor);
      controls.updatePanelState();
    },
    onToggleHistory: (anchor) => {
      settingsPanel.close();
      speechPanel.close();
      historyPanel.toggle(anchor);
      controls.updatePanelState();
    },
    getSettings,
    isPanelOpen: () => settingsPanel.isOpen,
    isSpeechPanelOpen: () => speechPanel.isOpen,
    isHistoryPanelOpen: () => historyPanel.isOpen,
  });

  await engine.mount();
  if (gen !== generation) {
    engine.destroy();
    return;
  }

  danmaku = engine;
  danmakuEmitter = emitter;
  translateQueue = queue;
  chatObserver = observer;
  controlButton = controls;

  await observer.start();
  if (gen !== generation) return;
  await controls.mount();
  if (gen !== generation) return;

  console.log('[YDM] YouTube Danmaku initialized');
}

async function reconcile() {
  if (reconciling) return;
  const key = pageKey();
  if (key === navKey) {
    if (!key) return;
    controlButton?.remount();
    if (chatObserver && !chatObserver.isConnected()) {
      chatObserver.start().catch((err) => console.warn('[YDM] Chat restart failed:', err));
    }
    return;
  }

  reconciling = true;
  navKey = key;
  try {
    teardown();
    if (key) await boot();
  } catch (err) {
    console.error('[YDM] Reinit failed:', err);
    navKey = null;
  } finally {
    reconciling = false;
  }
}

function watchNavigation() {
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
      reconcile().catch((err) => console.error('[YDM] Reinit failed:', err));
    }, 50);
  });
  setInterval(() => {
    reconcile().catch((err) => console.error('[YDM] Reinit failed:', err));
  }, 1500);
}

document.addEventListener('visibilitychange', handleVisibilityChange);

navKey = pageKey();
if (navKey) {
  boot().catch((err) => {
    console.error('[YDM] Init failed:', err);
    navKey = null;
  });
}

watchNavigation();
})();

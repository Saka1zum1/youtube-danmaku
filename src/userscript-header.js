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

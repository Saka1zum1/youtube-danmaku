// ==UserScript==
// @name         YouTube Danmaku - Bullet Chat
// @name:zh-CN   YouTube 弹幕
// @name:zh-TW   YouTube 彈幕
// @name:ja      YouTube 弾幕
// @namespace    youtube-danmaku
// @version      1.6.5
// @description  Turn YouTube live chat into scrolling danmaku — Super Chat pins, favorites, hide chat, and more
// @description:zh-CN  将 YouTube 直播聊天转为滚动弹幕，支持 Super Chat 悬停、收藏、收起聊天等
// @description:zh-TW  將 YouTube 直播聊天轉為滾動彈幕，支援 Super Chat 懸停、收藏、收起聊天等
// @description:ja  YouTube ライブチャットを弾幕化。Super Chat 固定、お気に入り、チャット非表示などに対応
// @author       KaKa
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

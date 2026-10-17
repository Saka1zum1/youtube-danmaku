# YouTube Danmaku

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

A Tampermonkey userscript that turns YouTube live chat into scrolling danmaku on the video. Interaction and translation follow [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) (MIT); the player and chat adapters target YouTube's watch page.

## Features

- **Live danmaku** — New live-chat messages scroll across the video
- **Sender colors** — The scrolling line is the message only; each chatter gets a stable color, and owner / moderator colors are kept
- **Interactive pause** — Hover or click to pause; click to show the sender, and the original text when a line was translated
- **Copy to chat** — The tooltip copy button writes the message into the live chat input
- **Customization** — Speed, font, scroll area (full / top half / top quarter)
- **Fullscreen-aware** — Follows player resize, theater mode, and fullscreen
- **Translation** — Microsoft, Google, Volcengine, Caiyun, and Tencent Transmart. Busy chat is batched, and a rate-limited engine is skipped. Numbers and symbols are left as-is
- **Anti-flood** — Messages already on screen when you join, and the first 2.5 seconds after that, are not fired as a burst
- **Bilingual UI** — Follows the browser language (Chinese / English)

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Open [`dist/youtube-danmaku.user.js`](dist/youtube-danmaku.user.js), or paste that file into a new Tampermonkey script, then save
3. Allow User Scripts in the browser's extension settings if the script does not run

Or build from source:

```bash
git clone <this-repository>
cd youtube-danmaku
npm run build
```

The built script is `dist/youtube-danmaku.user.js`.

## Usage

1. Open a YouTube watch page with live chat or chat replay (`/watch` or `/live/...`)
2. Keep the chat docked on the page. The script reads `ytd-live-chat-frame#chat` (the `iframe#chatframe` inside it). A popped-out chat window is not observed
3. New messages scroll over `ytd-player #movie_player .html5-video-container`
4. Two buttons are added at the left of the player's right-hand controls:
   - **Danmaku** — turn scrolling on or off
   - **Settings** — open the options panel
5. Hover a line to pause it. Click it to see who sent it
6. Click the copy icon to put that text into the live chat box. You still send it yourself
7. After a hover, scrolling resumes 0.3 s after the pointer leaves. After a click, click outside the tooltip to resume

## Settings

| Option | Description |
|--------|-------------|
| Scroll speed | 1–10, higher is faster |
| Font size | 14–40 px |
| Font | 18 system fonts |
| Scroll area | Full / top half / top quarter |
| Translation | Replaces the on-screen text |
| Translation engine | Auto / Microsoft / Google / Volcengine / Caiyun / Tencent Transmart |
| Target language | Source language is detected automatically |
| Translation speed | 1–10 messages per second. Busy chat is merged into fewer requests |

Settings are stored locally and kept across visits.

## Development

```bash
npm run build
npm run watch
```

The public demo needs no build step: [demo/preview.html](https://saka1zum1.github.io/youtube-danmaku/demo/preview.html). It stands in for the watch page (player, control bar, and chat list). Lines already in the list stay put; lines added after the short warm-up scroll across the video. The preview keeps running when its browser tab is in the background.

## Notes

- Desktop `youtube.com` watch pages are the supported layout. The script also matches `m.youtube.com`, but the mobile player markup can differ
- Translation calls Microsoft, Google, Volcengine, Caiyun, or Tencent. Some regions need a proxy
- YouTube DOM changes can break the chat reader or the control-bar buttons. Please report issues

## License

[MIT](LICENSE). Danmaku interaction and the translation stack are adapted from [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) © 2026 kakageo.

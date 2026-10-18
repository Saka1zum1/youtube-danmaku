# YouTube Danmaku

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

A Tampermonkey userscript that turns YouTube live chat into scrolling danmaku on the video. Interaction and translation follow [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) (MIT); the player and chat adapters target YouTube's watch page.

## Features

- **Live danmaku** — New live-chat messages scroll across the video
- **Sender colors** — The scrolling line is the message only; each chatter gets a stable color, and owner / moderator colors are kept
- **Interactive pause** — Hover or click to pause; click to show the sender, and the original text when a line was translated
- **Copy to chat** — The tooltip copy button writes the message into the live chat input
- **Read aloud** — Optional speech for new danmaku. The control-bar icon opens the speech panel. Volume 0 shows a mute icon. Lines that are only symbols, emotes, or numbers are skipped, and a repeated phrase is read at most three times
- **Customization** — Speed, font, opacity, scroll area (full / top half / top quarter)
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
4. Four buttons are added at the left of the player's right-hand controls:
   - **Danmaku** — turn scrolling on or off
   - **Read aloud** — open the speech panel
   - **Download** — export the archived chat replay
   - **Settings** — open the options panel
5. Hover a line to pause it. Click it to see who sent it
6. Click the copy icon to put that text into the live chat box. You still send it yourself. Click the speaker icon to read that one line
7. After a hover, scrolling resumes 0.3 s after the pointer leaves. After a click, click outside the tooltip to resume

## Settings

| Option | Description |
|--------|-------------|
| Scroll speed | 1–10, higher is faster |
| Font size | 14–40 px |
| Danmaku opacity | 10–100% |
| Read aloud | Off by default. The panel sets voice, volume, pitch, and speed. Volume 0 mutes the icon |
| Pace mode | Raises speed so one line stays within the max time. With translation on, length uses the translated text |
| Font | 18 system fonts |
| Scroll area | Full / top half / top quarter |
| Translation | Replaces the on-screen text |
| Translation engine | Auto / Microsoft / Google / Volcengine / Caiyun / Tencent Transmart |
| Target language | Source language is detected automatically |
| Translation speed | 1–10 messages per second. Busy chat is merged into fewer requests |

## Chat history

The download button reads the saved chat replay for an archived live (the same `live_chat` data a player such as yt-dlp writes). Keep the chat docked on the page. The panel can filter by keyword and username, include or skip Super Chat, clip a time range, and save CSV, JSON, or TXT. If the video has no chat replay, the panel says so.

Settings are stored locally and kept across visits.

## Development

```bash
npm run build
npm run watch
```

The public demo needs no build step: [YouTube Danmaku demo](https://saka1zum1.github.io/youtube-danmaku/). It stands in for the watch page (player, control bar, and chat list). Lines already in the list stay put; lines added after the short warm-up scroll across the video. The read-aloud button and speech panel work on this page. The preview keeps running when its browser tab is in the background.

## Notes

- Desktop `youtube.com` watch pages are the supported layout. The script also matches `m.youtube.com`, but the mobile player markup can differ
- Translation calls Microsoft, Google, Volcengine, Caiyun, or Tencent. Some regions need a proxy
- YouTube DOM changes can break the chat reader or the control-bar buttons. Please report issues

## License

[MIT](LICENSE). Danmaku interaction and the translation stack are adapted from [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) © 2026 kakageo.

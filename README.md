# YouTube Danmaku

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

A Tampermonkey userscript that turns YouTube live chat into scrolling danmaku on the video. Interaction and translation follow [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) (MIT); the player and chat adapters target YouTube's watch page.

## Features

- **Live danmaku** — New live-chat messages scroll across the video
- **Sender colors** — The scrolling line is the message only; each chatter gets a stable color, and owner / moderator colors are kept
- **Interactive pause** — Hover or click to pause; click to show the sender, and the original text when a line was translated
- **Copy to chat** — The tooltip copy button writes the message into the live chat input
- **Read aloud** — Optional speech for new danmaku. The control-bar icon opens the speech panel. Volume 0 shows a mute icon. Lines that are only symbols, emotes, or numbers are skipped, and a repeated phrase is read at most three times
- **Customization** — Speed, font, opacity, scroll area (full / top half / bottom half / top quarter)
- **Fullscreen-aware** — Follows player resize, theater mode, and fullscreen
- **Translation** — Microsoft, Google, Volcengine, Caiyun, and Tencent Transmart. Busy chat is batched, and a rate-limited engine is skipped. Numbers and symbols are left as-is
- **Manual chat translate** — Right-click a docked chat line for Translate / Retranslate. Failed runs retry with another engine
- **Chat context menu** — Right-click a line to translate, read aloud, send as danmaku, save to favorites, or open the sender’s channel
- **Favorites & wheel** — Star beside the chat input to save lines, send with one click or number shortcuts, or run wheel mode on a timer
- **Clear live chat** — Header button empties the docked chat panel without closing it
- **Hide / show chat** — Collapse the live chat to free video space; restore from the side tab or the player control bar
- **Fullscreen chat input** — In live fullscreen, press Enter to compose and send without leaving fullscreen
- **Enhanced picture-in-picture** — A player button opens a floating window with the video and danmaku. Turn danmaku on or off, open settings, send chat (including favorites), lock or stretch the picture, refresh the video, or return to the watch page. While that window is open, chat and danmaku keep going if you switch tabs. Needs Chrome or Edge 116 or newer
- **Super Chat pin** — Optional pins at the top, corners, or bottom of the player. Full mode shows avatar, name, amount, and message; compact mode shows avatar, truncated name, and amount — tap to open a detail card. Up to ten can show at once. Pin time can follow the YouTube chat ticker or use your own setting. Pins may optionally sit over scrolling danmaku
- **Super Chat actions** — Click a Super Chat (or its detail card) for translate, read aloud, send as danmaku, favorite, or open the sender’s profile
- **Live viewers** — Concurrent and total viewers beside the Live badge when the stream reports them
- **Anti-flood** — Messages already on screen when you join, and the first 2.5 seconds after that, are not fired as a burst
- **UI languages** — Follows the browser language (Chinese / English / Japanese)

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
4. Buttons are added at the left of the player's right-hand controls:
   - **Danmaku** — turn scrolling on or off
   - **Read aloud** — open the speech panel
   - **Download** — export the archived chat replay
   - **Settings** — open the options panel
   - **Show chat** — appears after you hide the live chat panel
   - **Enhanced picture-in-picture** — open a floating window with video and danmaku
5. Hover a line to pause it. Click it to see who sent it
6. Click the copy icon to put that text into the live chat box. You still send it yourself. Click the speaker icon to read that one line
7. After a hover, scrolling resumes 0.3 s after the pointer leaves. After a click, click outside the tooltip to resume
8. Right-click a chat message for translate / speak / danmaku / favorite / open profile. Click a Super Chat for the same actions. Use the chat header to clear or hide the panel; in fullscreen, press Enter to type

## Settings

| Option | Description |
|--------|-------------|
| Scroll speed | 1–10, higher is faster |
| Font size | 14–40 px |
| Danmaku opacity | 10–100% |
| Read aloud | Off by default. The panel sets voice, volume, pitch, and speed. Volume 0 mutes the icon |
| Pace mode | Raises speed so one line stays within the max time. With translation on, length uses the translated text |
| Font | 18 system fonts |
| Scroll area | Full / top half / bottom half / top quarter |
| Pin Super Chats | Hold paid messages on the player; choose position, compact or full layout, and up to ten at once |
| Super Chat pin time | Manual seconds, or match the YouTube chat ticker when that option is on |
| Super Chat overlay | Optional: let pins cover scrolling danmaku instead of pushing them down |
| Super Chat animation | Enter/exit motion for each pinned card |
| Translation | Replaces the on-screen danmaku text |
| Show translation in chat | Optional: keep the original line and add a distinct translation under it in the docked chat |
| Translation engine | Auto / Microsoft / Google / Volcengine / Caiyun / Tencent Transmart |
| Target language | Source language is detected automatically |
| Translation speed | 1–10 messages per second. Busy chat is merged into fewer requests |

## Chat history

Keep the chat docked on the page. On a **live** stream, download exports messages currently shown in the chat panel (including wall-clock timestamps such as `9:40 PM`). On an **archived** live, it reads the full saved chat replay (the same `live_chat` data a player such as yt-dlp writes). You can pause, resume, or cancel a long replay fetch. The panel can filter by keyword and username, include or skip Super Chat, clip a time range on replays, and save CSV, JSON, or TXT.

Settings are stored locally and kept across visits.

## Development

```bash
npm run build
npm run watch
```

The public demo needs no build step: [YouTube Danmaku demo](https://saka1zum1.github.io/youtube-danmaku/). It stands in for the watch page (player, control bar, and chat list). Lines already in the list stay put; lines added after the short warm-up scroll across the video. Try read-aloud, favorites, clear / hide chat, right-click actions, Super Chat pin options (position, compact mode, scroll area, ticker time), and the enhanced picture-in-picture button (Chrome or Edge 116+). The preview keeps running when its browser tab is in the background.

## Notes

- Desktop `youtube.com` watch pages are the supported layout. The script also matches `m.youtube.com`, but the mobile player markup can differ
- Translation calls Microsoft, Google, Volcengine, Caiyun, or Tencent. Some regions need a proxy
- YouTube DOM changes can break the chat reader or the control-bar buttons. Please report issues

## License

[MIT](LICENSE). Danmaku interaction and the translation stack are adapted from [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) © 2026 kakageo.

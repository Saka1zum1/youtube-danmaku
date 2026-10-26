**English** · [简体中文](https://greasyfork.org/zh-CN/scripts/599648-youtube-danmaku-bullet-chat) · [繁體中文](https://greasyfork.org/zh-TW/scripts/599648-youtube-danmaku-bullet-chat) · [日本語](https://greasyfork.org/ja/scripts/599648-youtube-danmaku-bullet-chat)

[YouTube Danmaku demo](https://saka1zum1.github.io/youtube-danmaku/)

## Introduction

YouTube Danmaku turns new YouTube live-chat messages into scrolling danmaku over the video — just like on Bilibili.

No more constantly glancing at the chat panel. Messages flow across the screen so you never miss the action.

## How to Use

1. Install the Tampermonkey extension
2. Install this script, then open a YouTube watch page that has live chat or chat replay (`/watch` or `/live/...`)
3. Keep the chat docked on the right side of the page. A popped-out chat window is not read
4. New buttons appear at the left of the player's right-hand controls:
   - **Danmaku button** — Toggle danmaku on/off
   - **Read-aloud button** — Open the speech panel
   - **Download button** — Export the archived chat replay
   - **Settings button** — Open the options panel
   - **Show chat** — Appears after you hide the live chat panel
5. Customize appearance, turn on read-aloud, or enable translation in the panels

**Tip:** Hover over a danmaku to pause and read it. Click to see who sent it. Use the copy button in the bubble to put the text into the live chat box. You still send it yourself. The speaker button reads that one line. Right-click a chat line to translate, read aloud, send as danmaku, favorite, or open the sender’s page. Click a Super Chat for the same actions. Clear or hide chat from the chat header; in fullscreen, press Enter to type.

### Live Danmaku

- Automatically captures new live-chat and chat-replay messages and displays them on the video
- Shows message content only — each sender gets a stable color. Owner and moderator colors are kept
- Hover or click any danmaku to pause it
- Click to reveal the sender. The copy button in the bubble writes the message into the live chat input. The speaker button reads that line
- Right-click a chat message for Translate / Retranslate, read aloud, send as danmaku, favorite, or open profile. If one translation engine fails, another is tried

### Favorites & wheel

- Star beside the chat input to save lines you reuse often
- Send with one click or number shortcuts; optional wheel mode sends favorites on a timer

### Clear & hide chat

- Clear the docked chat list from the header without closing chat
- Hide the live chat panel so the video can use the full width; restore from the side tab or the player bar

### Fullscreen chat

- On a live stream in fullscreen, press Enter to open a composer and send without exiting fullscreen

### Super Chat

- Optional pins at the top, corners, or bottom of the player
- Full layout: avatar, name, amount, and message. Compact layout: avatar, short name, and amount — tap for a detail card with the full message
- Up to ten pins at once; pin time can follow the YouTube chat ticker or your own setting
- Optional: let pins sit over scrolling danmaku instead of pushing them aside
- Click a Super Chat (or its detail card) to translate, read aloud, send as danmaku, favorite, or open the sender’s profile

### Live viewers

- When the stream reports them, concurrent and total viewers appear beside the Live badge

### Read aloud

- The control-bar icon opens the speech panel. Turn reading on there. Volume 0 switches the icon to mute
- Choose voice, volume, pitch, and reading speed
- Pace mode raises the speed so one line stays within the max time. With translation on, length uses the translated text
- Symbols, emotes, or numbers alone are not read. A repeated phrase is read at most three times
- Busy chat keeps only the latest lines so reading can catch up

### Chat history

- On a live stream, download exports messages currently shown in the docked chat (with wall-clock timestamps)
- On an archived live, it reads the full saved chat replay and can pause, resume, or cancel
- Filter by keywords and usernames. Leave them empty to keep every matching line
- Choose whether Super Chat is included, clip a time range on replays, and save CSV, JSON, or TXT
- If there is nothing to export, or the request fails, the panel explains that

### Customization

- Adjust scroll speed, font size, danmaku opacity (10–100%), and choose from 18 system fonts
- Scroll area: full screen / top half / bottom half / top quarter
- Super Chat pin position, compact mode, duration (manual or match YouTube ticker), overlay option, and animation
- Block keywords. A message is hidden when the original text or the translation contains one
- Auto-adapts to fullscreen, theater mode, and window resize

### Real-Time Translation (Optional)

- Engines: Auto, Microsoft, Google, Volcengine, Caiyun, and Tencent Transmart
- Source language is detected automatically; the translation replaces the on-screen danmaku text
- Optional: also show a distinct translation under each line in the docked chat while keeping the original
- Manual per-message translate from the chat context menu, with engine failover on retry
- Choose the target language and translation speed
- Numbers and symbols are left as-is. Busy chat is merged into fewer requests

### Quality of Life

- No flood of historical messages when you join a stream
- No burst of queued messages when you return to the tab
- UI follows the browser language (Chinese / English / Japanese)
- Zero external dependencies — lightweight and fast

## Demo

Open the demo in your browser. No install or build step is required:

[YouTube Danmaku demo](https://saka1zum1.github.io/youtube-danmaku/)

The page stands in for a YouTube watch page, with a video player, the control bar, and a live-chat list. Messages already in the list stay put. After a short warm-up, new messages scroll across the video. Try danmaku controls, read-aloud, favorites, clear / hide chat, right-click actions, and Super Chat samples.

## FAQ

**Q: Translation doesn't work?**
A: Translation calls Microsoft, Google, Volcengine, Caiyun, or Tencent, depending on the engine you picked. A network proxy may be required in some regions.

**Q: No danmaku appears?**
A: Open a watch page with live chat or chat replay, and keep that chat docked on the page. A popped-out chat window is not read. Ordinary videos without live chat have nothing to show.

**Q: Too many danmaku on screen?**
A: Slow down the speed, reduce the scroll area, or turn danmaku off entirely.

**Q: Which browsers are supported?**
A: Any browser with Tampermonkey — Chrome, Edge, Firefox, Safari, and more. The desktop `youtube.com` watch page is the supported layout.

## Privacy

- This script only runs on YouTube pages
- When translation is on, the text to translate is sent to the selected engine: Microsoft, Google, Volcengine, Caiyun, or Tencent Transmart
- Settings are stored locally in your browser. Nothing else is uploaded

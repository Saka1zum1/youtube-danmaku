**English** · [简体中文](https://greasyfork.org/zh-CN/scripts/599648-youtube-danmaku-bullet-chat) · [繁體中文](https://greasyfork.org/zh-TW/scripts/599648-youtube-danmaku-bullet-chat) · [日本語](https://greasyfork.org/ja/scripts/599648-youtube-danmaku-bullet-chat)

## Introduction

YouTube Danmaku turns new YouTube live-chat messages into scrolling danmaku over the video — just like on Bilibili.

No more constantly glancing at the chat panel. Messages flow across the screen so you never miss the action.

## How to Use

1. Install the Tampermonkey extension
2. Install this script, then open a YouTube watch page that has live chat or chat replay (`/watch` or `/live/...`)
3. Keep the chat docked on the right side of the page. A popped-out chat window is not read
4. Four new buttons appear at the left of the player's right-hand controls:
   - **Danmaku button** — Toggle danmaku on/off
   - **Read-aloud button** — Open the speech panel
   - **Download button** — Export the archived chat replay
   - **Settings button** — Open the options panel
5. Customize appearance, turn on read-aloud, or enable translation in the panels

**Tip:** Hover over a danmaku to pause and read it. Click to see who sent it. Use the copy button in the bubble to put the text into the live chat box. You still send it yourself. The speaker button reads that one line.

### Live Danmaku

- Automatically captures new live-chat and chat-replay messages and displays them on the video
- Shows message content only — each sender gets a stable color. Owner and moderator colors are kept
- Hover or click any danmaku to pause it
- Click to reveal the sender. The copy button in the bubble writes the message into the live chat input. The speaker button reads that line

### Read aloud

- The control-bar icon opens the speech panel. Turn reading on there. Volume 0 switches the icon to mute
- Choose voice, volume, pitch, and reading speed
- Pace mode raises the speed so one line stays within the max time. With translation on, length uses the translated text
- Symbols, emotes, or numbers alone are not read. A repeated phrase is read at most three times
- Busy chat keeps only the latest lines so reading can catch up

### Chat history

- The download button reads the saved chat replay and can save CSV, JSON, or TXT
- Filter by keywords and usernames. Leave them empty to keep every matching line
- Choose whether Super Chat is included, and clip a time range on the video
- If the archive has no chat replay, or the request fails, the panel explains that

### Customization

- Adjust scroll speed, font size, danmaku opacity (10–100%), and choose from 18 system fonts
- Scroll area: full screen / top half / top quarter
- Block keywords. A message is hidden when the original text or the translation contains one
- Auto-adapts to fullscreen, theater mode, and window resize

### Real-Time Translation (Optional)

- Engines: Auto, Microsoft, Google, Volcengine, Caiyun, and Tencent Transmart
- Source language is detected automatically; the translation replaces the on-screen text
- Choose the target language and translation speed
- Numbers and symbols are left as-is. Busy chat is merged into fewer requests

### Quality of Life

- No flood of historical messages when you join a stream
- No burst of queued messages when you return to the tab
- UI follows the browser language (Chinese / English)
- Zero external dependencies — lightweight and fast

## Demo

Open the demo in your browser. No install or build step is required:

[YouTube Danmaku demo](https://saka1zum1.github.io/youtube-danmaku/demo/preview.html)

The page stands in for a YouTube watch page, with a video player, the control bar, and a live-chat list. Messages already in the list stay put. After a short warm-up, new messages scroll across the video. The danmaku button, read-aloud panel, settings panel, and keyword list work on this page.

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

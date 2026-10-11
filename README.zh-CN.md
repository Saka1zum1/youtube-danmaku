# YouTube 弹幕

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

把 YouTube 直播聊天转成视频上滚动弹幕的油猴脚本。交互和翻译架构参照 [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku)（MIT），播放器与聊天读取改为 YouTube 观看页。

## 功能

- **实时弹幕** — 直播聊天的新消息在画面上滚动
- **发送者配色** — 滚动时只显示内容；每个用户颜色稳定，房主 / 管理员沿用其身份色
- **交互暂停** — 悬停或点击暂停；点击可看发送者，翻译过的弹幕会附上原文
- **复制到聊天框** — 提示框里的复制按钮把文字写入直播聊天输入框
- **自定义** — 速度、字体、滚动区域（全屏 / 上半屏 / 顶部 1/4）
- **全屏自适应** — 跟随播放器缩放、剧场模式和全屏
- **实时翻译** — Microsoft、Google、火山翻译、彩云小译、腾讯交互翻译。高峰时合并请求，被限流的引擎会先跳过。纯数字和符号不翻译
- **防堆积** — 进房时已经在列表里的消息，以及随后约 2.5 秒内的消息，不会一次性刷出来
- **双语界面** — 跟随浏览器语言（中文 / 英文）

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 用油猴打开 [`dist/youtube-danmaku.user.js`](dist/youtube-danmaku.user.js)，或把文件内容粘贴进新建脚本后保存
3. 若脚本没有运行，在浏览器的扩展设置里允许用户脚本

或从源码构建：

```bash
git clone <this-repository>
cd youtube-danmaku
npm run build
```

构建产物是 `dist/youtube-danmaku.user.js`。

## 使用

1. 打开带直播聊天或聊天回放的 YouTube 观看页（`/watch` 或 `/live/...`）
2. 聊天保持嵌在页面右侧。脚本读取 `ytd-live-chat-frame#chat` 里的 `iframe#chatframe`。弹出的独立聊天窗口不会被监听
3. 新消息在 `ytd-player #movie_player` 的 `.html5-video-container` 上滚动
4. 播放器右侧控制组的最左边会多出两个按钮：
   - **弹幕** — 开关滚动
   - **设置** — 打开选项
5. 悬停一条弹幕会暂停；点击可看是谁发的
6. 点击复制图标，文字会进直播聊天输入框，仍需自己发送
7. 悬停时，指针离开约 0.3 秒后继续滚动；点击锁定后，点提示框外面才会继续

## 设置

| 选项 | 说明 |
|------|------|
| 滚动速度 | 1–10，越大越快 |
| 字体大小 | 14–40 px |
| 字体 | 18 种系统字体 |
| 滚动区域 | 全屏 / 上半屏 / 顶部 1/4 |
| 启用翻译 | 画面上改为显示译文 |
| 翻译引擎 | 自动切换 / Microsoft / Google / 火山翻译 / 彩云小译 / 腾讯交互翻译 |
| 目标语言 | 源语言自动检测 |
| 翻译速度 | 1–10 条/秒。忙的时候多条会合成更少的请求 |

设置保存在本地，下次打开仍然有效。

## 开发

```bash
npm run build
npm run watch
```

`demo/preview.html` 用本地页面代替观看页（播放器、控制栏、聊天列表）。先构建，再用静态服务器打开：

```bash
npx serve .
```

访问 `/demo/preview.html`。列表里已有的消息不会滚动；预热结束后新加的消息会从画面上飘过。预览页在浏览器标签位于后台时也会继续跑。

## 注意事项

- 支持的是桌面版 `youtube.com` 观看页。脚本也会匹配 `m.youtube.com`，但移动版播放器结构可能不同
- 翻译会请求 Microsoft、Google、火山、彩云或腾讯，部分地区需要代理
- YouTube 改版后，聊天读取或控制栏按钮可能失效，欢迎反馈

## 许可证

[MIT](LICENSE)。弹幕交互和翻译栈改编自 [Twitch Danmaku](https://github.com/Saka1zum1/twitch-danmaku) © 2026 kakageo。

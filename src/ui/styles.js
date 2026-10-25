const YDM_STYLE_ID = 'ydm-style-root';
const YDM_CHAT_STYLE_ID = 'ydm-style-chat-frame';

const YDM_CSS = `
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
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      overflow: hidden;
      box-sizing: border-box;
    }

    .ydm-superchat-layer.ydm-sc-bottom {
      justify-content: flex-end;
    }

    .ydm-superchat-item {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      gap: 6px;
      box-sizing: border-box;
      width: fit-content;
      max-width: min(720px, calc(100% - 24px));
      padding: 5px 28px 5px 6px;
      border-radius: 999px;
      font-weight: 500;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      pointer-events: auto;
      cursor: pointer;
      user-select: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      animation-duration: var(--ydm-sc-duration, 6s);
      animation-timing-function: ease;
      animation-fill-mode: forwards;
    }

    .ydm-sc-close {
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 3;
      width: 22px;
      height: 22px;
      margin: 0;
      padding: 0;
      border: none;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: #ffffff;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease, background-color 0.1s ease, color 0.1s ease;
    }

    .ydm-superchat-item:hover .ydm-sc-close,
    .ydm-superchat-item.ydm-paused .ydm-sc-close,
    .ydm-superchat-item:focus-within .ydm-sc-close {
      opacity: 1;
      pointer-events: auto;
    }

    .ydm-sc-close:hover {
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }

    .ydm-sc-close:active {
      background: rgba(255, 255, 255, 0.3);
    }

    .ydm-sc-close svg {
      width: 14px;
      height: 14px;
      display: block;
      pointer-events: none;
      fill: currentColor;
    }

    .ydm-sc-avatar {
      width: 1.45em;
      height: 1.45em;
      border-radius: 50%;
      object-fit: cover;
      flex: 0 0 auto;
      background: rgba(0, 0, 0, 0.2);
    }

    .ydm-sc-username {
      flex: 0 0 auto;
      max-width: 7.5em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 0.92;
      font-size: 0.78em;
      font-weight: 500;
    }

    .ydm-sc-amount {
      flex: 0 0 auto;
      font-size: 0.78em;
      font-weight: 700;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .ydm-sc-message-clip {
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      max-width: 100%;
    }

    .ydm-sc-message {
      display: inline-block;
      white-space: nowrap;
      font-size: 0.92em;
      font-weight: 500;
      will-change: transform;
    }

    .ydm-superchat-item.ydm-sc-marquee .ydm-sc-message {
      animation: ydm-sc-marquee var(--ydm-sc-marquee-duration, 4s) linear 0.45s infinite alternate;
    }

    .ydm-superchat-item.ydm-paused .ydm-sc-message {
      animation-play-state: paused;
    }

    @keyframes ydm-sc-marquee {
      0%, 8% { transform: translateX(0); }
      92%, 100% { transform: translateX(var(--ydm-sc-marquee-distance, 0)); }
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

    .ytp-time-display.ytp-live .ytp-time-wrapper.ydm-live-time-wrapper {
      white-space: nowrap;
      max-width: none;
      padding-right: 2px;
    }

    .ytp-time-display.ytp-live .ytp-time-wrapper.ydm-live-views-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      max-width: none;
      margin-left: 2px;
      vertical-align: top;
    }

    .ytp-time-display.ytp-live .ytp-time-wrapper.ydm-live-views-wrapper[hidden] {
      display: none !important;
    }

    .ydm-live-views-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }

    .ydm-live-views-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
      display: block;
    }

    .ydm-live-views-count {
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.01em;
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

    .ydm-control-btn.ydm-chat-expand-control-btn[hidden] {
      display: none !important;
    }

    .ydm-control-btn.ydm-chat-expand-control-btn.ydm-visible {
      display: inline-flex !important;
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

    .ydm-fav-panel {
      max-height: min(80vh, 580px);
      display: flex;
      flex-direction: column;
    }

    .ydm-fav-add-row {
      display: flex;
      gap: 8px;
      padding: 10px 12px 0;
    }

    .ydm-fav-add-input {
      flex: 1;
      min-width: 0;
      height: 32px;
      box-sizing: border-box;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: #18181b;
      color: #efeff1;
      padding: 0 10px;
      font-size: 13px;
    }

    .ydm-fav-add-btn,
    .ydm-fav-item-send,
    .ydm-fav-wheel-toggle {
      border: none;
      border-radius: 4px;
      background: #ff4e45;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 0 10px;
      height: 32px;
      cursor: pointer;
      white-space: nowrap;
    }

    .ydm-fav-add-btn:hover,
    .ydm-fav-item-send:hover,
    .ydm-fav-wheel-toggle:hover {
      background: #e53935;
    }

    .ydm-fav-wheel-toggle.is-running {
      background: #eb0400;
    }

    .ydm-fav-wheel-toggle.is-running:hover {
      background: #c50300;
    }

    .ydm-fav-list {
      margin-top: 10px;
      padding: 0 12px;
      overflow: auto;
      max-height: 240px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ydm-fav-empty {
      color: #adadb8;
      font-size: 12px;
      padding: 12px 0;
      text-align: center;
    }

    .ydm-fav-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .ydm-fav-item.is-global {
      border-color: rgba(255, 78, 69, 0.45);
    }

    .ydm-fav-item-meta {
      font-size: 11px;
      font-weight: 600;
      color: #adadb8;
    }

    .ydm-fav-item.is-global .ydm-fav-item-meta {
      color: #ff8a80;
    }

    .ydm-fav-item-text {
      width: 100%;
      box-sizing: border-box;
      resize: vertical;
      min-height: 32px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: #18181b;
      color: #efeff1;
      padding: 6px 8px;
      font: inherit;
      font-size: 13px;
    }

    .ydm-fav-item-tools {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .ydm-fav-item-shortcut {
      height: 28px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: #18181b;
      color: #efeff1;
      font-size: 12px;
    }

    .ydm-fav-item-scope {
      height: 28px;
      border: none;
      border-radius: 4px;
      background: #3a3a3d;
      color: #efeff1;
      font-size: 12px;
      font-weight: 600;
      padding: 0 10px;
      cursor: pointer;
    }

    .ydm-fav-item-scope:hover {
      background: #ff4e45;
    }

    .ydm-fav-item-remove {
      margin-left: auto;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: #3a3a3d;
      color: #efeff1;
      font-size: 12px;
      font-weight: 600;
      padding: 0 10px;
      cursor: pointer;
    }

    .ydm-fav-item-remove:hover {
      background: #ad1c1c;
    }

    .ydm-fav-status {
      min-height: 16px;
      margin: 6px 12px 0;
      color: #ff8280;
      font-size: 12px;
    }

    .ydm-fav-status.is-ok {
      color: #00f593;
    }

    .ydm-fav-wheel {
      margin-top: 10px;
      padding: 10px 12px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ydm-fav-wheel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .ydm-fav-wheel-title {
      font-size: 13px;
      font-weight: 700;
    }

    .ydm-fav-wheel-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .ydm-fav-wheel-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: #adadb8;
      font-size: 12px;
    }

    .ydm-fav-wheel-field input {
      width: 88px;
      height: 28px;
      box-sizing: border-box;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: #18181b;
      color: #efeff1;
      padding: 0 8px;
      font-size: 12px;
    }

    .ydm-fav-wheel-status {
      color: #adadb8;
      font-size: 12px;
    }

    .ydm-fs-chat {
      position: absolute !important;
      left: 50% !important;
      bottom: max(72px, 10%) !important;
      transform: translateX(-50%) !important;
      z-index: 100020 !important;
      width: min(560px, calc(100% - 48px));
      max-width: calc(100% - 24px);
      display: flex !important;
      flex-direction: column;
      gap: 6px;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      font-family: "YouTube Sans", Roboto, Arial, sans-serif;
    }

    .ydm-fs-chat-row {
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      background: rgba(14, 14, 16, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 10px 36px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    }

    .ydm-fs-chat-input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      height: 40px;
      padding: 0 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: #18181b;
      color: #efeff1;
      font-size: 14px;
      line-height: 40px;
      outline: none;
      caret-color: #ff4e45;
    }

    .ydm-fs-chat-input::placeholder {
      color: #adadb8;
    }

    .ydm-fs-chat-input:focus {
      border-color: #ff4e45;
      box-shadow: 0 0 0 1px #ff4e45;
    }

    .ydm-fs-chat-fav-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .ydm-fs-chat-fav,
    .ydm-fs-chat-send {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: 72px;
      height: 40px;
      padding: 0 14px;
      border: none;
      border-radius: 6px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .ydm-fs-chat-fav {
      background: #3a3a3d;
    }

    .ydm-fs-chat-fav:hover,
    .ydm-fs-chat-fav.is-open {
      background: #53535f;
    }

    .ydm-fs-chat-fav svg,
    .ydm-fs-chat-send svg {
      width: 16px;
      height: 16px;
      display: block;
      flex-shrink: 0;
    }

    .ydm-fs-chat-send {
      background: #ff4e45;
    }

    .ydm-fs-chat-send:hover:not(:disabled) {
      background: #e53935;
    }

    .ydm-fs-chat-send:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ydm-fs-chat-fav-list {
      position: absolute;
      left: 0;
      bottom: calc(100% + 6px);
      z-index: 2;
      box-sizing: border-box;
      width: max(220px, 100%);
      max-width: min(360px, 70vw);
      max-height: 220px;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 6px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(14, 14, 16, 0.96);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(10px);
    }

    .ydm-fs-chat-fav-empty {
      padding: 10px 8px;
      color: #adadb8;
      font-size: 12px;
      line-height: 1.4;
      text-align: center;
    }

    .ydm-fs-chat-fav-item {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      padding: 8px 10px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #efeff1;
      font-size: 13px;
      line-height: 1.35;
      text-align: left;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .ydm-fs-chat-fav-item:hover {
      background: rgba(255, 78, 69, 0.28);
    }

    .ydm-fs-chat-close {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      min-width: 72px;
      padding: 0 14px;
      border: none;
      border-radius: 6px;
      background: #eb0400;
      color: #ffffff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .ydm-fs-chat-close:hover {
      background: #c50300;
    }

    .ydm-fs-chat-meta {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 0 4px;
      min-height: 16px;
    }

    .ydm-fs-chat-status {
      flex: 1;
      min-width: 0;
      max-width: 60%;
      color: #ff8280;
      font-size: 12px;
      line-height: 1.35;
      text-align: left;
      word-break: break-word;
    }

    .ydm-fs-chat-status:empty {
      display: none;
    }

    .ydm-fs-chat-status.is-ok {
      color: #00f593;
    }

    /* ---- chat frame / overlays (also injected into live chat iframe) ---- */
.ydm-chat-translation {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  margin: 3px 0 1px;
  padding: 3px 0 2px 8px;
  border-left: 2px solid rgba(230, 33, 23, 1);
  background: rgba(155, 155, 155, 0.4);
  color: #fff;
  font-size: 12.5px;
  line-height: 1.4;
  font-weight: 400;
  font-style: italic;
  white-space: normal;
  word-break: break-word;
}

.ydm-chat-translation-label {
  flex: 0 0 auto;
  margin-top: 1px;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(230, 33, 23, 1);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  font-style: normal;
  letter-spacing: 0.02em;
  line-height: 1.5;
  text-transform: uppercase;
}

.ydm-chat-translation-text {
  flex: 1 1 auto;
  min-width: 0;
  color: #0f0f0f;
}

.ydm-chat-translation--pending .ydm-chat-translation-text {
  color: #606060;
  font-style: italic;
}

.ydm-chat-translation--error .ydm-chat-translation-text {
  color: #b71c1c;
}

.ydm-chat-menu {
  position: fixed;
  z-index: 2147483646;
  min-width: 160px;
  padding: 6px 0;
  border-radius: 8px;
  background: #212121;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
  color: #fff;
  font-family: Roboto, Arial, sans-serif;
  font-size: 13px;
}

.ydm-chat-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.ydm-chat-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ydm-chat-menu-item svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  flex: 0 0 auto;
}

.ydm-sc-action-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  margin: 6px 0 2px;
  padding: 6px;
  border-radius: 8px;
  background: rgba(15, 15, 15, 0.72);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

/* Paid sticker cards: panel sits after #card so it never steals author-name width. */
yt-live-chat-paid-sticker-renderer > .ydm-sc-action-panel,
yt-live-chat-paid-message-renderer > .ydm-sc-action-panel {
  margin: 4px 8px 8px;
  width: auto;
}




.ydm-sc-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
}

.ydm-sc-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ydm-sc-action-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.ydm-sc-action-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex: 0 0 auto;
}

.ydm-chat-clear-wrap,
.ydm-chat-collapse-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: 0 2px 0 0;
}

.ydm-chat-clear-btn,
.ydm-chat-collapse-btn,
.ydm-fav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 8px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--yt-live-chat-header-button-color, var(--yt-spec-text-secondary, #aaa));
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ydm-chat-clear-btn:hover,
.ydm-chat-collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--yt-spec-text-primary, #f1f1f1);
}

/* Hide live chat and let the player reclaim the sidebar width. */
html.ydm-chat-collapsed ytd-live-chat-frame,
html.ydm-chat-collapsed #chat.ytd-watch-flexy,
html.ydm-chat-collapsed #chat-container {
  display: none !important;
}

html.ydm-chat-collapsed #secondary,
html.ydm-chat-collapsed #columns > :not(#primary):has(ytd-live-chat-frame),
html.ydm-chat-collapsed #columns > :not(#primary):has(#chat) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  flex: 0 0 0 !important;
  overflow: hidden !important;
}

html.ydm-chat-collapsed ytd-watch-flexy,
html.ydm-chat-collapsed #columns {
  --ytd-watch-flexy-sidebar-width: 0px !important;
  --ytd-watch-flexy-sidebar-min-width: 0px !important;
  --ytd-watch-flexy-chat-max-height: 0px !important;
}

html.ydm-chat-collapsed #columns.ytd-watch-flexy #primary,
html.ydm-chat-collapsed ytd-watch-flexy #primary,
html.ydm-chat-collapsed #primary {
  max-width: 100% !important;
  width: 100% !important;
  flex: 1 1 auto !important;
}

html.ydm-chat-collapsed #primary-inner,
html.ydm-chat-collapsed #player,
html.ydm-chat-collapsed #player-container-outer,
html.ydm-chat-collapsed #player-container-inner,
html.ydm-chat-collapsed #player-container,
html.ydm-chat-collapsed #ytd-player,
html.ydm-chat-collapsed #ytd-player > #container {
  width: 100% !important;
  max-width: none !important;
}

.ydm-chat-expand-btn {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  transition: opacity 1s ease;
  opacity: 0;
  z-index: 2200;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 12px 14px 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-right: none;
  border-radius: 10px 0 0 10px;
  background: rgba(15, 15, 15, 0.92);
  color: #f1f1f1;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: -4px 0 18px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  font-family: "YouTube Sans", Roboto, Arial, sans-serif;
}

.ydm-chat-expand-btn:hover {
  opacity: 1;
  background: rgba(33, 33, 33, 0.96);
  color: #fff;
}

.ydm-chat-expand-btn svg {
  width: 20px;
  height: 20px;
  display: block;
  flex-shrink: 0;
  fill: currentColor;
  pointer-events: none;
}

.ydm-chat-expand-label {
  max-width: 7em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}


.ydm-fav-btn {
  color: var(--yt-spec-text-secondary, #aaa);
}

.ydm-fav-btn:hover {
  background: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1));
  color: #ffca5f;
}

.ydm-chat-clear-btn svg,
.ydm-chat-collapse-btn svg,
.ydm-fav-btn svg {
  width: 24px;
  height: 24px;
  display: block;
  pointer-events: none;
  fill: currentColor;
}
`;

function injectStyles() {
  GM_addStyle(YDM_CSS);
}

/** Inject the same stylesheet into the live chat iframe document (Trusted Types safe). */
function ensureChatDocStyles(doc) {
  if (!doc) return;
  let style = doc.getElementById(YDM_CHAT_STYLE_ID);
  if (!style) {
    style = doc.createElement('style');
    style.id = YDM_CHAT_STYLE_ID;
    (doc.head || doc.documentElement).appendChild(style);
  }
  if (style.textContent !== YDM_CSS) style.textContent = YDM_CSS;
}

/** @deprecated Use ensureChatDocStyles */
function ensureChatTranslateStyles(doc) {
  ensureChatDocStyles(doc);
}

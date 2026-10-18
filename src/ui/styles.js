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

    .ydm-history-download {
      display: block;
      width: calc(100% - 24px);
      margin: 0 12px 12px;
      border: none;
      border-radius: 8px;
      background: #ff4e45;
      color: #fff;
      padding: 8px 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .ydm-history-download:disabled {
      opacity: 0.6;
      cursor: default;
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

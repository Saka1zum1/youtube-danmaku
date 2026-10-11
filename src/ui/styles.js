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

    .ydm-danmaku-tooltip-copy {
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

    .ydm-danmaku-tooltip-copy:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    .ydm-danmaku-tooltip-copy svg {
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

    .ydm-balloon-select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      background: #0f0f0f;
      color: #f1f1f1;
      font-size: 13px;
    }

    .ydm-balloon-divider {
      height: 1px;
      margin: 4px 12px;
      background: rgba(255, 255, 255, 0.08);
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

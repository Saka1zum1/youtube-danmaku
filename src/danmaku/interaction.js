const MAX_DANMAKU_PAUSE_MS = 15000;
const RESUME_DELAY_MS = 300;

let activeTooltip = null;
let activeTooltipItem = null;
let hoverPausedItem = null;
let clickLockBackdrop = null;
let tooltipRepositionHandler = null;
let tooltipDismissBound = false;

function removeClickLockBackdrop() {
  clickLockBackdrop?.remove();
  clickLockBackdrop = null;
}

function showClickLockBackdrop(mount) {
  removeClickLockBackdrop();
  if (!mount) return;

  if (getComputedStyle(mount).position === 'static') {
    mount.style.position = 'relative';
  }

  clickLockBackdrop = document.createElement('div');
  clickLockBackdrop.className = 'ydm-click-lock-backdrop';
  clickLockBackdrop.addEventListener('pointerdown', (e) => {
    const otherDanmaku = document.elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el.classList?.contains('ydm-danmaku-item') && el !== activeTooltipItem);

    hideDanmakuTooltip();

    if (otherDanmaku) {
      requestAnimationFrame(() => {
        otherDanmaku.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
    }
  }, true);

  mount.appendChild(clickLockBackdrop);
}

function hideDanmakuTooltip() {
  if (tooltipRepositionHandler) {
    window.removeEventListener('resize', tooltipRepositionHandler);
    window.removeEventListener('scroll', tooltipRepositionHandler, true);
    document.removeEventListener('fullscreenchange', tooltipRepositionHandler);
    document.removeEventListener('webkitfullscreenchange', tooltipRepositionHandler);
    tooltipRepositionHandler = null;
  }

  removeClickLockBackdrop();

  const resumeFn = activeTooltipItem?._ydmResume;
  activeTooltipItem?.classList.remove('ydm-click-locked');
  activeTooltip?.remove();
  activeTooltip = null;
  activeTooltipItem = null;
  resumeFn?.();
}

function ensureTooltipDismissListener() {
  if (tooltipDismissBound) return;
  tooltipDismissBound = true;
  document.addEventListener('pointerdown', (e) => {
    if (!activeTooltip) return;
    if (activeTooltip.contains(e.target)) return;
    if (e.target.closest?.('.ydm-danmaku-item') === activeTooltipItem) return;
    if (clickLockBackdrop?.contains(e.target)) return;
    hideDanmakuTooltip();
  }, true);
}

function getVideoBounds() {
  const player = getPlayerElement();
  const video = player?.querySelector('video.html5-main-video') || player;
  const rect = video?.getBoundingClientRect();
  if (!rect || rect.width < 16 || rect.height < 16) return null;
  return rect;
}

function getTooltipHost() {
  return getFullscreenElement() || document.body;
}

function positionDanmakuTooltip(item, tooltip) {
  const bounds = getVideoBounds();
  if (!bounds) return;

  const host = getTooltipHost();
  if (tooltip.parentElement !== host) host.appendChild(tooltip);

  const margin = 8;
  const gap = 6;
  tooltip.style.position = 'fixed';
  tooltip.style.zIndex = '2147483646';
  tooltip.style.maxWidth = `${Math.max(96, bounds.width - margin * 2)}px`;
  tooltip.style.maxHeight = `${Math.max(32, bounds.height - margin * 2)}px`;

  const itemRect = item.getBoundingClientRect();
  const tipHeight = tooltip.offsetHeight;
  const tipWidth = tooltip.offsetWidth;
  const spaceAbove = itemRect.top - bounds.top - margin;
  const spaceBelow = bounds.bottom - itemRect.bottom - margin;
  const needed = tipHeight + gap;
  const placement = spaceAbove >= needed && (spaceBelow < needed || spaceAbove >= spaceBelow)
    ? 'above'
    : 'below';

  tooltip.classList.toggle('ydm-danmaku-tooltip--above', placement === 'above');
  tooltip.classList.toggle('ydm-danmaku-tooltip--below', placement === 'below');

  let left = itemRect.left + itemRect.width / 2 - tipWidth / 2;
  let top = placement === 'below'
    ? itemRect.bottom + gap
    : itemRect.top - tipHeight - gap;

  const minLeft = bounds.left + margin;
  const maxLeft = bounds.right - tipWidth - margin;
  const minTop = bounds.top + margin;
  const maxTop = bounds.bottom - tipHeight - margin;
  left = clamp(left, minLeft, Math.max(minLeft, maxLeft));
  top = clamp(top, minTop, Math.max(minTop, maxTop));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function bindTooltipReposition(item, tooltip) {
  tooltipRepositionHandler = () => positionDanmakuTooltip(item, tooltip);
  window.addEventListener('resize', tooltipRepositionHandler);
  window.addEventListener('scroll', tooltipRepositionHandler, true);
  document.addEventListener('fullscreenchange', tooltipRepositionHandler);
  document.addEventListener('webkitfullscreenchange', tooltipRepositionHandler);
}

function attachDanmakuInteraction(item, {
  username, usernameColor, profileUrl, originalMessage, translated, onPause, onResume,
}) {
  let hoverResumeTimer = null;
  let maxPauseTimer = null;
  let pauseReason = null;

  const clearHoverResumeTimer = () => {
    clearTimeout(hoverResumeTimer);
    hoverResumeTimer = null;
  };

  const clearMaxPauseTimer = () => {
    clearTimeout(maxPauseTimer);
    maxPauseTimer = null;
  };

  const armMaxPauseTimer = () => {
    clearMaxPauseTimer();
    maxPauseTimer = setTimeout(() => {
      if (item.classList.contains('ydm-paused')) doResume();
    }, MAX_DANMAKU_PAUSE_MS);
  };

  const doResume = () => {
    clearHoverResumeTimer();
    clearMaxPauseTimer();
    if (!item.classList.contains('ydm-paused')) {
      pauseReason = null;
      item.classList.remove('ydm-click-locked');
      return;
    }

    pauseReason = null;
    item.classList.remove('ydm-paused', 'ydm-click-locked');
    if (hoverPausedItem === item) hoverPausedItem = null;
    if (activeTooltipItem === item) {
      removeClickLockBackdrop();
      activeTooltip?.remove();
      activeTooltip = null;
      activeTooltipItem = null;
    }
    onResume?.();
  };

  item._ydmResume = () => doResume();
  item._ydmResumeHover = () => {
    if (pauseReason !== 'hover') return;
    doResume();
  };

  const scheduleHoverResume = () => {
    if (pauseReason === 'click') return;
    clearHoverResumeTimer();
    hoverResumeTimer = setTimeout(() => {
      if (pauseReason === 'hover') doResume();
    }, RESUME_DELAY_MS);
  };

  const pauseForHover = () => {
    if (activeTooltipItem) return;
    if (pauseReason === 'click') return;

    clearHoverResumeTimer();
    if (hoverPausedItem && hoverPausedItem !== item) {
      hoverPausedItem._ydmResumeHover?.();
    }
    hoverPausedItem = item;

    if (!item.classList.contains('ydm-paused')) {
      pauseReason = 'hover';
      item.classList.add('ydm-paused');
      onPause?.();
    } else if (pauseReason !== 'hover') {
      pauseReason = 'hover';
    }

    armMaxPauseTimer();
  };

  const pauseForClick = () => {
    clearHoverResumeTimer();
    if (hoverPausedItem && hoverPausedItem !== item) {
      hoverPausedItem._ydmResumeHover?.();
    }
    hoverPausedItem = null;

    pauseReason = 'click';
    item.classList.add('ydm-click-locked');
    if (!item.classList.contains('ydm-paused')) {
      item.classList.add('ydm-paused');
      onPause?.();
    }
    armMaxPauseTimer();
  };

  const showTooltip = () => {
    const messageText = originalMessage || item.textContent;
    const showOriginal = translated && originalMessage && originalMessage !== item.textContent;
    if (!username && !showOriginal && !messageText) return;

    ensureTooltipDismissListener();
    hideDanmakuTooltip();
    pauseForClick();

    item.dataset.ydmId = item.dataset.ydmId || String(Date.now() + Math.random());
    const mount = getDanmakuMount(item);
    if (!mount) {
      doResume();
      return;
    }

    showClickLockBackdrop(mount);

    const tooltip = document.createElement('div');
    tooltip.className = 'ydm-danmaku-tooltip ydm-danmaku-tooltip--above';
    tooltip.dataset.itemId = item.dataset.ydmId;

    const bubble = document.createElement('div');
    bubble.className = 'ydm-danmaku-tooltip-bubble';

    const header = document.createElement('div');
    header.className = 'ydm-danmaku-tooltip-header';

    if (username) {
      const nameRow = document.createElement(profileUrl ? 'a' : 'span');
      nameRow.className = 'ydm-danmaku-tooltip-name';
      nameRow.textContent = username;
      nameRow.style.color = safeCssColor(usernameColor || '#ff4e45');
      if (profileUrl) {
        nameRow.href = profileUrl;
        nameRow.target = '_blank';
        nameRow.rel = 'noopener noreferrer';
        nameRow.setAttribute('aria-label', t('tooltipOpenProfile'));
        nameRow.addEventListener('click', (e) => e.stopPropagation());
      }
      header.appendChild(nameRow);
    } else {
      header.classList.add('ydm-danmaku-tooltip-header--solo');
    }

    if (messageText) {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'ydm-danmaku-tooltip-copy';
      copyBtn.setAttribute('aria-label', t('tooltipCopy'));
      appendMarkup(copyBtn, ICON_COPY);
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await Promise.all([
          setChatInputText(messageText),
          copyTextToClipboard(messageText),
        ]);
        hideDanmakuTooltip();
      });
      header.appendChild(copyBtn);
    }

    bubble.appendChild(header);

    if (showOriginal) {
      const originalRow = document.createElement('div');
      originalRow.className = 'ydm-danmaku-tooltip-original';
      originalRow.textContent = truncateText(originalMessage);
      bubble.appendChild(originalRow);
    }

    const tail = document.createElement('div');
    tail.className = 'ydm-danmaku-tooltip-tail';
    tooltip.append(bubble, tail);
    tooltip.addEventListener('click', (e) => e.stopPropagation());
    tooltip.addEventListener('pointerdown', (e) => e.stopPropagation());

    getTooltipHost().appendChild(tooltip);
    positionDanmakuTooltip(item, tooltip);
    bindTooltipReposition(item, tooltip);
    activeTooltip = tooltip;
    activeTooltipItem = item;

    requestAnimationFrame(() => {
      if (activeTooltip === tooltip) positionDanmakuTooltip(item, tooltip);
    });
  };

  item.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
  });

  item.addEventListener('mouseenter', () => {
    pauseForHover();
  });

  item.addEventListener('mouseleave', () => {
    if (pauseReason === 'click') return;
    scheduleHoverResume();
  });

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showTooltip();
  });

  item.addEventListener('animationend', () => {
    clearHoverResumeTimer();
    clearMaxPauseTimer();
    if (activeTooltipItem === item) hideDanmakuTooltip();
  }, { once: true });
}

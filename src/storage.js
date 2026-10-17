function loadSettings() {
  try {
    const saved = GM_getValue(STORAGE_KEY, null);
    if (saved && typeof saved === 'object') {
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      if (merged.scrollArea === 'half') {
        merged.scrollArea = 'top-half';
      }
      if (!TRANSLATE_PROVIDERS.includes(merged.translateProvider)) {
        merged.translateProvider = DEFAULT_SETTINGS.translateProvider;
      }
      merged.blockKeywords = normalizeBlockKeywords(merged.blockKeywords);
      return merged;
    }
  } catch (_) {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS, blockKeywords: [] };
}

function saveSettings(settings) {
  GM_setValue(STORAGE_KEY, settings);
}

function normalizeBlockKeywords(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const words = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const word = item.trim().slice(0, 40);
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
    if (words.length >= 50) break;
  }
  return words;
}

function messageMatchesBlock(text, keywords) {
  const haystack = String(text || '').toLowerCase();
  if (!haystack || !keywords?.length) return false;
  return keywords.some((word) => {
    const needle = String(word || '').trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isPageActive() {
  return !document.hidden && document.visibilityState === 'visible';
}

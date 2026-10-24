const TOOLTIP_ORIGINAL_MAX = 64;

function withoutEmoteTokens(text) {
  return String(text || '').replace(/⟦[ETS]\d+⟧/g, ' ');
}

function shouldSkipTranslation(text) {
  const trimmed = withoutEmoteTokens(text).trim();
  if (!trimmed) return true;
  if (/^[\d\s+\-*/%=^#@&|<>[\]{}\\]+$/u.test(trimmed)) return true;
  if (/^[\p{P}\p{S}\s\d]+$/u.test(trimmed)) return true;
  return false;
}

function needsMachineTranslation(text) {
  return !!withoutEmoteTokens(text).trim();
}

function truncateText(text, max = TOOLTIP_ORIGINAL_MAX) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function preparedGroupKey(preparedText, placeholders) {
  return `${preparedText}\0${placeholders.map((item) => item.replacement).join('\0')}`;
}

async function translateMessages(texts, targetLang, provider = 'microsoft', options = {}) {
  const results = new Array(texts.length);
  const pending = [];
  const bypassCache = !!options.bypassCache;

  texts.forEach((text, index) => {
    if (bypassCache) clearCachedTranslation(text, targetLang);
    else {
      const cached = getCachedTranslation(text, targetLang);
      if (cached != null) {
        results[index] = cached;
        return;
      }
    }

    const isolated = isolateEmoteShortcodes(text);
    if (shouldSkipTranslation(isolated.text) || text.length > 500) {
      results[index] = text;
      return;
    }

    const prepared = prepareDictionaryText(isolated.text, targetLang);
    const restore = (value) => restoreEmoteShortcodes(
      restoreDictionaryText(value, prepared.placeholders),
      isolated.kept,
    );
    if (prepared.fullyMapped || !needsMachineTranslation(prepared.preparedText)) {
      results[index] = restore(prepared.preparedText);
      return;
    }

    pending.push({
      index,
      original: text,
      preparedText: prepared.preparedText,
      placeholders: prepared.placeholders,
      kept: isolated.kept,
    });
  });

  if (!pending.length) return { texts: results };

  const groups = new Map();
  for (const item of pending) {
    const key = preparedGroupKey(item.preparedText, item.placeholders);
    if (!groups.has(key)) {
      groups.set(key, { preparedText: item.preparedText, items: [] });
    }
    groups.get(key).items.push(item);
  }

  const unique = [...groups.values()];
  const outcome = await translateBatch(
    unique.map((group) => group.preparedText),
    targetLang,
    provider,
  );
  if (outcome.retryAfter) return outcome;

  unique.forEach((group, groupIndex) => {
    const machine = outcome.texts[groupIndex]?.trim()
      ? outcome.texts[groupIndex]
      : group.preparedText;
    const cacheable = !!outcome.texts[groupIndex]?.trim();

    for (const item of group.items) {
      const restored = restoreEmoteShortcodes(
        restoreDictionaryText(machine, item.placeholders),
        item.kept,
      )?.trim() || item.original;
      results[item.index] = restored;
      // Avoid caching no-op / echo results so retranslate can switch engines.
      if (cacheable && restored !== item.original) {
        setCachedTranslation(item.original, targetLang, restored);
      }
    }
  });

  return { texts: results };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Manual single-message translate with provider failover.
 * Retries with `auto` when the preferred engine fails or returns an unchanged echo.
 */
async function translateMessagesManual(text, targetLang, preferred = 'microsoft', options = {}) {
  const source = String(text || '').trim();
  if (!source) return '';

  const providers = preferred && preferred !== 'auto'
    ? [preferred, 'auto', 'auto']
    : ['auto', 'auto'];

  let last = '';
  for (let i = 0; i < providers.length; i += 1) {
    const bypassCache = options.bypassCache || i > 0;
    const outcome = await translateMessages([source], targetLang, providers[i], { bypassCache });

    if (outcome?.retryAfter) {
      await sleep(Math.min(Math.max(50, outcome.retryAfter), 1200));
      continue;
    }

    const rendered = outcome?.texts?.[0]?.trim() || '';
    if (rendered && rendered !== source) return rendered;
    last = rendered || last;
  }

  return last;
}

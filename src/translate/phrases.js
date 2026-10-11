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

async function translateMessages(texts, targetLang, provider = 'microsoft') {
  const results = new Array(texts.length);
  const pending = [];

  texts.forEach((text, index) => {
    const cached = getCachedTranslation(text, targetLang);
    if (cached != null) {
      results[index] = cached;
      return;
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
      if (cacheable) setCachedTranslation(item.original, targetLang, restored);
    }
  });

  return { texts: results };
}

export const preferredLanguageCoverage = 50;

export function translationCoverage(reference: unknown, translation: unknown) {
  const coverage = countTranslatedStrings(reference, translation);
  return coverage.total === 0
    ? 0
    : Math.round((coverage.translated / coverage.total) * 100);
}

interface TranslationCount {
  total: number;
  translated: number;
}

function countTranslatedStrings(
  reference: unknown,
  translation: unknown,
): TranslationCount {
  if (typeof reference === "string") {
    return {
      total: 1,
      translated: typeof translation === "string" ? 1 : 0,
    };
  }
  if (!isRecord(reference)) return { total: 0, translated: 0 };

  let total = 0;
  let translated = 0;
  for (const [key, value] of Object.entries(reference)) {
    const child = countTranslatedStrings(
      value,
      isRecord(translation) ? translation[key] : undefined,
    );
    total += child.total;
    translated += child.translated;
  }
  return { total, translated };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

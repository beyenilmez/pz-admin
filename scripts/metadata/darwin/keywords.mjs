import metadata from "#/assets/metadata.json" with { type: "json" };

export function keywordList(translations, sourceTranslations) {
  const translatedKeywords = {
    ...sourceTranslations.keywords,
    ...translations.keywords,
  };
  // macOS app search expects comma-separated strings.
  // https://developer.apple.com/forums/thread/761535
  return [
    ...new Set([...metadata.keywords, ...Object.values(translatedKeywords)]),
  ].join(",");
}

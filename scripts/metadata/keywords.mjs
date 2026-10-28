export function metadataKeywords(translations, sourceTranslations) {
  // Keep English terms searchable even when translated equivalents exist.
  return [
    ...new Set([
      ...Object.values(sourceTranslations.keywords ?? {}),
      ...Object.values(translations.keywords ?? {}),
    ]),
  ];
}

import { metadataKeywords } from "#/scripts/metadata/keywords.mjs";

export function keywordList(translations, sourceTranslations) {
  // macOS app search expects comma-separated strings.
  // https://developer.apple.com/forums/thread/761535
  return metadataKeywords(translations, sourceTranslations).join(",");
}

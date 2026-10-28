import { defaultLanguage } from "#/frontend/scripts/shared/metadata.mjs";
import { metadataKeywords } from "#/scripts/metadata/keywords.mjs";
import { escapeXml, languageAttribute } from "./xml.mjs";

export function buildKeywordsXml(translationsByLanguage) {
  const keywords = [];
  for (const [language, translations] of translationsByLanguage) {
    for (const text of metadataKeywords(
      translations,
      translationsByLanguage.get(defaultLanguage),
    )) {
      keywords.push(
        `    <keyword${languageAttribute(language)}>${escapeXml(text)}</keyword>`,
      );
    }
  }
  return keywords.length
    ? `  <keywords>\n${keywords.join("\n")}\n  </keywords>`
    : "";
}

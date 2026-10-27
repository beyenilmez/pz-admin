import metadata from "#/assets/metadata.json" with { type: "json" };
import { escapeXml, languageAttribute } from "./xml.mjs";

export function buildKeywordsXml(translationsByLanguage) {
  const keywords = metadata.keywords.map(
    (text) => `    <keyword translate="no">${escapeXml(text)}</keyword>`,
  );
  for (const [language, translations] of translationsByLanguage) {
    for (const text of Object.values(translations.keywords ?? {})) {
      keywords.push(
        `    <keyword${languageAttribute(language)}>${escapeXml(text)}</keyword>`,
      );
    }
  }
  return keywords.length
    ? `  <keywords>\n${keywords.join("\n")}\n  </keywords>`
    : "";
}

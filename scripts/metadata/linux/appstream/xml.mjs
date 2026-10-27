import { defaultLanguage } from "#/frontend/scripts/shared/metadata.mjs";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";

export function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function languageAttribute(language, sourceLanguage = defaultLanguage) {
  return language === sourceLanguage
    ? ""
    : ` xml:lang="${metadataLocale(language, "posix")}"`;
}

import { defaultLanguage } from "#/frontend/scripts/shared/metadata.mjs";
import metadata from "#/assets/metadata.json" with { type: "json" };
import { replaceMarker } from "#/scripts/metadata/markers.mjs";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";

// Escape special characters and preserve edge spaces in desktop-entry values.
// https://specifications.freedesktop.org/desktop-entry/latest/value-types.html
function escapeDesktop(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")
    .replace(/^ +| +$/g, (spaces) => "\\s".repeat(spaces.length));
}

export function generateDesktop(template, translationsByLanguage) {
  const genericNameLines = [];
  const commentLines = [];
  const keywordLines = [];
  for (const [language, translations] of translationsByLanguage) {
    const localeSuffix =
      language === defaultLanguage
        ? ""
        : `[${metadataLocale(language, "posix")}]`;
    if (translations.genericName)
      genericNameLines.push(
        `GenericName${localeSuffix}=${escapeDesktop(translations.genericName)}`,
      );
    if (translations.summary)
      commentLines.push(
        `Comment${localeSuffix}=${escapeDesktop(translations.summary)}`,
      );
    if (translations.keywords && Object.keys(translations.keywords).length) {
      // Fall back within a translated keyword list when individual keys are missing.
      const keywordsWithFallback = {
        ...translationsByLanguage.get(defaultLanguage).keywords,
        ...translations.keywords,
      };
      keywordLines.push(
        `Keywords${localeSuffix}=${[
          ...Object.values(keywordsWithFallback),
          ...metadata.keywords,
        ]
          .map((text) => escapeDesktop(text).replaceAll(";", "\\;"))
          .join(";")};`,
      );
    }
  }
  const withGenericNames = replaceMarker(
    template,
    "generic-name",
    genericNameLines.join("\n"),
    "desktop",
  );
  const withComments = replaceMarker(
    withGenericNames,
    "summary",
    commentLines.join("\n"),
    "desktop",
  );
  return replaceMarker(
    withComments,
    "keywords",
    keywordLines.join("\n"),
    "desktop",
  );
}

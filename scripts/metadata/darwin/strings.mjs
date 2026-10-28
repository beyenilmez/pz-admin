import { keywordList } from "./keywords.mjs";
import { permissionDescriptions } from "./permissions.mjs";

// InfoPlist.strings uses quoted keys and values, not XML escaping.
// https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/LoadingResources/Strings/Strings.html
function quoteString(text) {
  return `"${text
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")}"`;
}

export function generateInfoPlistStrings(translations, sourceTranslations) {
  const values = {
    MDItemKeywords: keywordList(translations, sourceTranslations),
    ...permissionDescriptions(translations),
  };
  return Object.entries(values)
    .map(([key, text]) => `${quoteString(key)} = ${quoteString(text)};\n`)
    .join("");
}

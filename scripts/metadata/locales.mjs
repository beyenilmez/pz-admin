import localeMappings from "./locales.json" with { type: "json" };
import localeRegistry from "#/frontend/src/i18n/locales.json" with { type: "json" };

const localeFormats = {
  posix: /^[a-z]{2,3}(?:_[A-Z]{2})?(?:@[a-zA-Z]+)?$/,
  apple: /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/,
  android: /^b\+[a-z]{2,3}(?:\+[A-Za-z0-9]+)*$/,
  windows: /^[0-9a-f]{4}$/,
  nsis: /^[A-Za-z]+$/,
};

const metadataLanguages = Object.keys(localeRegistry);
// Validate the complete mapping before any metadata files are generated.
validateLocaleMappings();

export function metadataLocale(language, format) {
  if (!Object.hasOwn(localeFormats, format))
    throw new Error(`Unknown metadata locale format: ${format}`);
  if (!Object.hasOwn(localeMappings, language))
    throw new Error(`Unknown metadata language: ${language}`);
  return localeMappings[language][format];
}

function validateLocaleMappings() {
  for (const language of Object.keys(localeMappings)) {
    if (!Object.hasOwn(localeRegistry, language))
      throw new Error(
        `Metadata locale mapping has an unknown language: ${language}`,
      );
  }
  for (const [format, pattern] of Object.entries(localeFormats)) {
    const usedIdentifiers = new Set();
    for (const language of metadataLanguages) {
      const identifier = localeMappings[language]?.[format];
      if (typeof identifier !== "string" || !pattern.test(identifier))
        throw new Error(
          `Missing or invalid ${format} locale mapping for ${language}`,
        );
      // NSIS bundles one Spanish translation for several regional locales.
      if (format !== "nsis" && usedIdentifiers.has(identifier))
        throw new Error(`Duplicate ${format} locale mapping: ${identifier}`);
      usedIdentifiers.add(identifier);
    }
  }
}

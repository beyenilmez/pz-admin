import { defaultLanguage, locales } from "#/frontend/src/i18n/locales.ts";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";

export function generateInstallerMetadata(translationsByLanguage) {
  const sourceSummary = translationsByLanguage.get(defaultLanguage)?.summary;
  if (typeof sourceSummary !== "string" || !sourceSummary.trim())
    throw new Error("Missing source Windows installer description");

  // NSIS uses the first included language as its final fallback.
  const installerLanguages = [
    ...new Set([
      metadataLocale(defaultLanguage, "nsis"),
      ...locales.map(({ code }) => metadataLocale(code, "nsis")),
    ]),
  ];
  const descriptions = collectTranslatedDescriptions(translationsByLanguage);

  const languageDirectives = installerLanguages.map(
    (language) => `!insertmacro MUI_LANGUAGE "${language}"`,
  );
  const descriptionDirectives = installerLanguages.map((language) => {
    const summary = descriptions.get(language) ?? sourceSummary;
    return `LangString APP_DESCRIPTION \${LANG_${language.toUpperCase()}} "${escapeInstallerString(summary)}"`;
  });

  return `${languageDirectives.join("\n")}\n\n${descriptionDirectives.join("\n")}\n`;
}

function collectTranslatedDescriptions(translationsByLanguage) {
  const descriptions = new Map();
  for (const { code } of locales) {
    const summary = translationsByLanguage.get(code)?.summary;
    if (summary === undefined) continue;
    if (typeof summary !== "string" || !summary.trim())
      throw new Error(`Invalid Windows installer description for ${code}`);

    const installerLanguage = metadataLocale(code, "nsis");
    // Prefer es-ES for NSIS' SpanishInternational; otherwise use the first available.
    if (!descriptions.has(installerLanguage) || code === "es-ES")
      descriptions.set(installerLanguage, summary);
  }
  return descriptions;
}

function escapeInstallerString(text) {
  // Escape NSIS variables and quoted-string control characters.
  // https://nsis.sourceforge.io/Docs/Chapter4.html#strings
  return text
    .replaceAll("$", () => "$$")
    .replaceAll('"', '$\\"')
    .replaceAll("\r", "$\\r")
    .replaceAll("\n", "$\\n")
    .replaceAll("\t", "$\\t");
}

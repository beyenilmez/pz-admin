import localeRegistry from "./locales.json" with { type: "json" };

export type SupportedLanguage = keyof typeof localeRegistry;

export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return Object.entries(localeRegistry).some(
    ([code, supported]) => code === language && supported,
  );
}

function nativeLanguageName(language: SupportedLanguage) {
  try {
    const displayNames = new Intl.DisplayNames([language], {
      languageDisplay: "standard",
      type: "language",
    });
    return displayNames.of(language) ?? language;
  } catch {
    return language;
  }
}

export const locales = Object.keys(localeRegistry).flatMap((code) =>
  isSupportedLanguage(code)
    ? [{ code, nativeName: nativeLanguageName(code) }]
    : [],
);

export const defaultLanguage = "en-US" satisfies SupportedLanguage;

const localeDetails = locales.map(({ code }) => {
  const locale = new Intl.Locale(code);
  return {
    code,
    language: locale.language,
    script: locale.maximize().script,
    region: locale.region,
  };
});

export function detectLanguage(
  preferredLanguages: readonly string[],
): SupportedLanguage {
  for (const language of preferredLanguages) {
    let preferred: Intl.Locale;
    try {
      preferred = new Intl.Locale(language);
    } catch {
      continue;
    }
    // Resolve each preference fully before considering the next language.
    if (isSupportedLanguage(preferred.baseName)) return preferred.baseName;

    // Infer missing details (e.g. zh-TW uses Traditional Chinese).
    const preferredLocale = preferred.maximize();
    // Generic locales can serve any region; regional variants must match.
    const match = localeDetails.find(
      (candidate) =>
        candidate.language === preferredLocale.language &&
        candidate.script === preferredLocale.script &&
        (!candidate.region || candidate.region === preferredLocale.region),
    );
    if (match) return match.code;
  }
  return defaultLanguage;
}

export function canonicalLanguage(language: string) {
  return Intl.getCanonicalLocales(language)[0];
}

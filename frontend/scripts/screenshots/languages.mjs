import { defaultLanguage } from "../../src/i18n/locales.ts";
import { preferredLanguageCoverage } from "../../src/i18n/coverage.ts";
import { languageCoverage } from "../shared/translations.mjs";

export async function screenshotLanguages() {
  const languages = await languageCoverage();
  return [
    defaultLanguage,
    ...languages
      .filter(
        ({ code, percentage }) =>
          code !== defaultLanguage && percentage >= preferredLanguageCoverage,
      )
      .map(({ code }) => code),
  ];
}

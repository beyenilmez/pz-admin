import { defaultLanguage } from "#/frontend/scripts/shared/metadata.mjs";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";

export function generateVersionInfo(template, translationsByLanguage) {
  const version = template.fixed.file_version;
  const sourceSummary = translationsByLanguage.get(defaultLanguage)?.summary;
  if (typeof sourceSummary !== "string" || !sourceSummary.trim())
    throw new Error("Missing source Windows file description");

  const sharedInfo = {
    ...template.info["0000"],
    FileVersion: version,
    ProductVersion: version,
  };
  // Keep English available when Windows cannot match a translated resource.
  const info = {
    "0000": { ...sharedInfo, FileDescription: sourceSummary },
  };
  for (const [language, translations] of translationsByLanguage) {
    const summary = translations.summary;
    if (summary === undefined) continue;
    if (typeof summary !== "string" || !summary.trim())
      throw new Error(`Invalid Windows file description for ${language}`);
    info[metadataLocale(language, "windows")] = {
      ...sharedInfo,
      FileDescription: summary,
    };
  }

  return {
    fixed: { ...template.fixed, product_version: version },
    info,
  };
}

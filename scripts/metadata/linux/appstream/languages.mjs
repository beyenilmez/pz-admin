import { metadataLocale } from "#/scripts/metadata/locales.mjs";

export function buildLanguagesXml(languages) {
  const entries = languages
    .filter(({ percentage }) => percentage > 0)
    .map(
      ({ code, percentage }) =>
        `    <lang percentage="${percentage}">${metadataLocale(code, "posix")}</lang>`,
    );
  return `  <languages>\n${entries.join("\n")}\n  </languages>\n`;
}

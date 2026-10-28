import { defaultLanguage, locales } from "#/frontend/src/i18n/locales.ts";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";
import { replaceMarker } from "#/scripts/metadata/markers.mjs";
import { permissionDescriptions } from "./permissions.mjs";

export function generatePlist(template, translationsByLanguage) {
  const languages = [
    defaultLanguage,
    ...locales
      .map(({ code }) => code)
      .filter((code) => code !== defaultLanguage),
  ];
  // The interface manages its own translations rather than using .lproj resources.
  // https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundlelocalizations
  const localizations = [
    "\t\t<key>CFBundleDevelopmentRegion</key>",
    `\t\t<string>${metadataLocale(defaultLanguage, "apple")}</string>`,
    "\t\t<key>CFBundleLocalizations</key>",
    "\t\t<array>",
    ...languages.map(
      (language) =>
        `\t\t\t<string>${metadataLocale(language, "apple")}</string>`,
    ),
    "\t\t</array>",
  ].join("\n");
  const permissions = permissionDescriptions(
    translationsByLanguage.get(defaultLanguage),
  );
  if (!permissions.NSLocalNetworkUsageDescription)
    throw new Error("Missing source local-network permission description");
  const permissionElements = Object.entries(permissions).map(([key, text]) => {
    const escapedText = text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    return `\t\t<key>${key}</key>\n\t\t<string>${escapedText}</string>`;
  });
  const withLocalizations = replaceMarker(
    template,
    "localizations",
    localizations,
  );
  return replaceMarker(
    withLocalizations,
    "permissions",
    permissionElements.join("\n"),
  );
}

import { defaultLanguage } from "#/frontend/scripts/shared/metadata.mjs";
import metadata from "#/assets/metadata.json" with { type: "json" };
import { escapeXml, languageAttribute } from "./xml.mjs";

const featureOrder = [
  "playerManagement",
  "catalogs",
  "serverOptions",
  "messageEditor",
  "serverActions",
  "connectionProfiles",
];

function translatedElements(
  tag,
  translationsByLanguage,
  selectText,
  indentation,
) {
  const elements = [];
  for (const [language, translations] of translationsByLanguage) {
    const text = selectText(translations);
    if (!text) {
      if (language === defaultLanguage)
        throw new Error(`Missing source ${tag} text`);
      continue;
    }
    elements.push(
      `${indentation}<${tag}${languageAttribute(language)}>${escapeXml(text)}</${tag}>`,
    );
  }
  return elements.join("\n");
}

export function buildSummaryXml(translationsByLanguage) {
  return translatedElements(
    "summary",
    translationsByLanguage,
    (translations) => translations.summary,
    "  ",
  );
}

export function buildDescriptionXml(translationsByLanguage) {
  const paragraphs = (selectText) =>
    translatedElements("p", translationsByLanguage, selectText, "    ");
  const features = featureOrder.map((feature) =>
    translatedElements(
      "li",
      translationsByLanguage,
      (translations) => translations.features?.[feature],
      "      ",
    ),
  );
  return [
    "  <description>",
    paragraphs((translations) => translations.description?.introduction),
    "    <ul>",
    ...features,
    "    </ul>",
    paragraphs((translations) => translations.description?.requirements),
    paragraphs((translations) => translations.description?.offlineTools),
    // Every localized description includes the same English attribution.
    paragraphs(() => metadata.attribution),
    "  </description>",
  ].join("\n");
}

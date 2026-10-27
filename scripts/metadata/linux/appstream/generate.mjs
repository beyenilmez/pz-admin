import { readFile } from "node:fs/promises";
import { languageCoverage } from "#/frontend/scripts/shared/translations.mjs";
import { replaceMarker } from "#/scripts/metadata/markers.mjs";
import { buildSummaryXml, buildDescriptionXml } from "./description.mjs";
import { buildLanguagesXml } from "./languages.mjs";
import { buildKeywordsXml } from "./keywords.mjs";
import { buildReleasesXml } from "./releases.mjs";
import { buildScreenshotsXml } from "./screenshots.mjs";

export async function generateAppStream(template, translationsByLanguage) {
  const repositoryUrl = template.match(
    /<url type="vcs-browser">([^<]+)<\/url>/,
  )?.[1];
  if (!repositoryUrl)
    throw new Error("AppStream metadata must include a vcs-browser URL");

  const releaseVersion = (await readFile("VERSION", "utf8")).trim();
  // Release Please creates the changelog when preparing the first release.
  const changelogMarkdown = await readOptionalText("CHANGELOG.md");
  const screenshotDirectory = "assets/screenshots";
  const screenshotManifestText = await readOptionalText(
    `${screenshotDirectory}/manifest.json`,
  );
  const screenshotManifest =
    screenshotManifestText === null ? null : JSON.parse(screenshotManifestText);

  const sections = [
    ["summary", buildSummaryXml(translationsByLanguage)],
    ["description", buildDescriptionXml(translationsByLanguage)],
    ["keywords", buildKeywordsXml(translationsByLanguage)],
    ["language-coverage", buildLanguagesXml(await languageCoverage())],
    [
      "screenshots",
      await buildScreenshotsXml(screenshotManifest, {
        presentation: "desktop",
        environment: "gnome",
        repositoryUrl: process.env.SOURCE_REPOSITORY || repositoryUrl,
        releaseVersion,
        sourceRef: process.env.SOURCE_REF || undefined,
        directory: screenshotDirectory,
      }),
    ],
    [
      "releases",
      changelogMarkdown === null
        ? ""
        : buildReleasesXml(changelogMarkdown, releaseVersion, repositoryUrl),
    ],
  ];

  let appStreamXml = template;
  for (const [markerName, sectionXml] of sections) {
    appStreamXml = replaceMarker(appStreamXml, markerName, sectionXml);
  }
  return appStreamXml;
}

async function readOptionalText(filename) {
  try {
    return await readFile(filename, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return null;
  }
}

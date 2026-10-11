import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildReleasesXml } from "./releases.mjs";
import { buildScreenshotsXml } from "./screenshots.mjs";
import { buildLanguagesXml } from "./languages.mjs";
import { languageCoverage } from "../../frontend/scripts/shared/translations.mjs";

const filename = "com.bedirhanyenilmez.pzadmin.metainfo.xml";
const source = await readFile(`build/linux/${filename}`, "utf8");
const repository = source.match(/<url type="vcs-browser">([^<]+)<\/url>/)?.[1];
if (!repository)
  throw new Error("AppStream metadata must include a vcs-browser URL");
// Release Please creates the changelog when preparing the first release.
const changelog = await readFile("CHANGELOG.md", "utf8").catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return null;
});
const version = (await readFile("VERSION", "utf8")).trim();

const screenshotDirectory = "assets/screenshots";
const manifest = JSON.parse(
  await readFile(`${screenshotDirectory}/manifest.json`, "utf8").catch(
    (error) => {
      if (error.code !== "ENOENT") throw error;
      return "null";
    },
  ),
);
const releaseBlock =
  changelog === null ? "" : buildReleasesXml(changelog, version, repository);
const languageBlock = buildLanguagesXml(await languageCoverage());
const screenshotBlock = await buildScreenshotsXml(manifest, {
  repository: process.env.SOURCE_REPOSITORY || repository,
  version,
  ref: process.env.SOURCE_REF || undefined,
  directory: screenshotDirectory,
});

await mkdir(".generated/linux", { recursive: true });
await writeFile(
  `.generated/linux/${filename}`,
  source.replace(
    "</component>",
    `${languageBlock}${screenshotBlock}${releaseBlock}</component>`,
  ),
);

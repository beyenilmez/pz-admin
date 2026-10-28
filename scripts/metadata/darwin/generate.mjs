import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readMetadataTranslations } from "#/frontend/scripts/shared/metadata.mjs";
import { generatePlist } from "./plist.mjs";
import { writeLocalizedResources } from "./resources.mjs";

const translationsByLanguage = await readMetadataTranslations();
const templateDirectory = "build/darwin";
const outputDirectory = ".generated/darwin";

await mkdir(outputDirectory, { recursive: true });
for (const filename of ["Info.plist", "Info.dev.plist"]) {
  const template = await readFile(`${templateDirectory}/${filename}`, "utf8");
  await writeFile(
    `${outputDirectory}/${filename}`,
    generatePlist(template, translationsByLanguage),
  );
}

await writeLocalizedResources(
  `${outputDirectory}/Resources`,
  translationsByLanguage,
);

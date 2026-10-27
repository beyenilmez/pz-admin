import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readMetadataTranslations } from "#/frontend/scripts/shared/metadata.mjs";
import { generateAppStream } from "./appstream/generate.mjs";
import { generateDesktop } from "./desktop.mjs";

const translationsByLanguage = await readMetadataTranslations();
const templateDirectory = "build/linux";
const outputDirectory = ".generated/linux";
const generators = [
  ["com.bedirhanyenilmez.pzadmin.metainfo.xml", generateAppStream],
  ["com.bedirhanyenilmez.pzadmin.desktop", generateDesktop],
];

await mkdir(outputDirectory, { recursive: true });
for (const [filename, generate] of generators) {
  const template = await readFile(`${templateDirectory}/${filename}`, "utf8");
  const generatedMetadata = await generate(template, translationsByLanguage);
  await writeFile(`${outputDirectory}/${filename}`, generatedMetadata);
}

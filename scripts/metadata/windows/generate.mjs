import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readMetadataTranslations } from "#/frontend/scripts/shared/metadata.mjs";
import { generateVersionInfo } from "./version-info.mjs";

const translationsByLanguage = await readMetadataTranslations();
const template = JSON.parse(await readFile("build/windows/info.json", "utf8"));
const versionInfo = generateVersionInfo(template, translationsByLanguage);

await mkdir(".generated/windows", { recursive: true });
await writeFile(
  ".generated/windows/info.json",
  `${JSON.stringify(versionInfo, null, 2)}\n`,
);

#!/usr/bin/env node
/* oxlint-disable eslint/no-await-in-loop -- Locale files are generated sequentially. */

import fs from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";
import { displayCategoryTranslations } from "../catalogs/items/game-data.mjs";
import { disambiguateItemNames } from "../catalogs/items/name-disambiguation.mjs";
import { frontendRoot } from "../shared/paths.mjs";
import {
  bcp47LanguageTag,
  decodeLuaString,
  findTranslationDirectory,
  gameTranslationFiles,
  readGameTranslationFile,
} from "./game-files.mjs";

function parseArgs(argv) {
  const args = { build: undefined, gameDirectory: undefined };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--build") args.build = argv[++index];
    else if (argument === "--game-dir") args.gameDirectory = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (args.build !== "41" && args.build !== "42") {
    throw new Error("Build must be 41 or 42");
  }
  if (!args.gameDirectory) {
    throw new Error("Game directory is required (--game-dir <path>)");
  }

  return args;
}

function parseTranslations(content, sourcePath) {
  const translations = {};

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(
      /^\s*ItemName_(\S+)\s*=\s*"(.*)"\s*,?\s*(?:--.*)?$/,
    );
    if (!match) continue;

    const [, id, encodedName] = match;
    translations[id] = decodeLuaString(encodedName);
  }

  if (Object.keys(translations).length === 0) {
    throw new Error(`No item translations found in ${sourcePath}`);
  }
  return translations;
}

async function readItemTranslations(languageDirectory, gameLanguage) {
  const { content, sourcePath } = await readGameTranslationFile(
    languageDirectory,
    `ItemName_${gameLanguage}.txt`,
  );
  return parseTranslations(content, sourcePath);
}

async function readJsonItemTranslations(languageDirectory) {
  const sourcePath = path.join(languageDirectory, "ItemName.json");
  const content = await fs.readFile(sourcePath, "utf8");
  const translations = JSON.parse(content);

  if (Object.keys(translations).length === 0) {
    throw new Error(`No item translations found in ${sourcePath}`);
  }
  return translations;
}

async function readLegacyCategoryTranslations(languageDirectory, gameLanguage) {
  const { content } = await readGameTranslationFile(
    languageDirectory,
    `IG_UI_${gameLanguage}.txt`,
  );
  const translations = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(IGUI_ItemCat_\S+)\s*=\s*"(.*)"\s*,?\s*(?:--.*)?$/,
    );
    if (match) translations[match[1]] = decodeLuaString(match[2]);
  }
  return displayCategoryTranslations(translations);
}

async function readJsonCategoryTranslations(languageDirectory) {
  const sourcePath = path.join(languageDirectory, "IG_UI.json");
  const translations = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  return displayCategoryTranslations(translations);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const translationDirectory = await findTranslationDirectory(
    path.resolve(args.gameDirectory),
  );
  const catalog = JSON.parse(
    await fs.readFile(
      path.join(frontendRoot, "src", "data", "items", `${args.build}.json`),
      "utf8",
    ),
  );
  const catalogIds = new Set(
    catalog.categories.flatMap((category) =>
      category.items.map((item) => item.id),
    ),
  );
  const categoryIds = new Set(
    catalog.categories.map((category) => category.id),
  );
  const outputDirectory = path.join(
    frontendRoot,
    "src",
    "data",
    "items",
    "locales",
    args.build,
  );
  await fs.mkdir(outputDirectory, { recursive: true });

  const usesJsonTranslations = args.build === "42";
  const languageFiles = await gameTranslationFiles(
    translationDirectory,
    (gameLanguage) =>
      usesJsonTranslations ? "ItemName.json" : `ItemName_${gameLanguage}.txt`,
  );
  if (languageFiles.length === 0) {
    throw new Error(
      `No item translation files found in ${translationDirectory} for Build ${args.build}`,
    );
  }

  for (const { gameLanguage, languageDirectory } of languageFiles) {
    // Skip unsupported Filipino and the game's novelty pseudo-language.
    if (gameLanguage === "PH" || gameLanguage === "STREW") continue;
    const languageTag = bcp47LanguageTag(gameLanguage);

    const availableTranslations = usesJsonTranslations
      ? await readJsonItemTranslations(languageDirectory)
      : await readItemTranslations(languageDirectory, gameLanguage);
    const translatedEntries = Object.entries(availableTranslations)
      .filter(([id]) => catalogIds.has(id))
      .map(([id, name]) => ({ id, name }));
    const disambiguatedNames = disambiguateItemNames(translatedEntries);
    const names = Object.fromEntries(
      translatedEntries.map(({ id }) => [id, disambiguatedNames.get(id)]),
    );
    const availableCategories = usesJsonTranslations
      ? await readJsonCategoryTranslations(languageDirectory)
      : await readLegacyCategoryTranslations(languageDirectory, gameLanguage);
    const categories = Object.fromEntries(
      Object.entries(availableCategories).filter(([id]) => categoryIds.has(id)),
    );
    const translations = { categories, names };
    const outputPath = path.join(outputDirectory, `${languageTag}.json`);
    const formatted = await format(JSON.stringify(translations), {
      parser: "json",
    });
    await fs.writeFile(outputPath, formatted);
    console.log(
      `${languageTag}: ${Object.keys(names).length}/${catalogIds.size} items, ${Object.keys(categories).length} categories translated`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

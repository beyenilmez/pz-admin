#!/usr/bin/env node
/* oxlint-disable eslint/no-await-in-loop -- Locale files are generated sequentially. */

import fs from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";
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
      /^\s*IGUI_perks_(\S+)\s*=\s*"(.*)"\s*,?\s*(?:--.*)?$/,
    );
    if (!match) continue;

    const [, id, encodedName] = match;
    translations[id] = decodeLuaString(encodedName);
  }

  if (Object.keys(translations).length === 0) {
    throw new Error(`No skill translations found in ${sourcePath}`);
  }
  return translations;
}

async function readSkillTranslations(languageDirectory, filename) {
  const { content, sourcePath } = await readGameTranslationFile(
    languageDirectory,
    filename,
  );
  return parseTranslations(content, sourcePath);
}

async function readJsonSkillTranslations(languageDirectory) {
  const sourcePath = path.join(languageDirectory, "IG_UI.json");
  const content = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const translations = Object.fromEntries(
    Object.entries(content)
      .filter(([id]) => id.startsWith("IGUI_perks_"))
      .map(([id, name]) => [id.slice("IGUI_perks_".length), name]),
  );
  if (Object.keys(translations).length === 0) {
    throw new Error(`No skill translations found in ${sourcePath}`);
  }
  return translations;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const translationDirectory = await findTranslationDirectory(
    path.resolve(args.gameDirectory),
  );
  const catalog = JSON.parse(
    await fs.readFile(
      path.join(frontendRoot, "src", "data", "skills", `${args.build}.json`),
      "utf8",
    ),
  );
  const categories = new Map(
    catalog.categories.map((category) => [category.id, category.translationId]),
  );
  const skills = new Map(
    catalog.categories.flatMap((category) =>
      category.skills.map((skill) => [
        skill.id,
        skill.translationId ?? skill.id,
      ]),
    ),
  );
  const outputDirectory = path.join(
    frontendRoot,
    "src",
    "data",
    "skills",
    "locales",
    args.build,
  );
  await fs.mkdir(outputDirectory, { recursive: true });

  const usesJsonTranslations = args.build === "42";
  const languageFiles = await gameTranslationFiles(
    translationDirectory,
    (gameLanguage) =>
      usesJsonTranslations ? "IG_UI.json" : `IG_UI_${gameLanguage}.txt`,
  );
  if (languageFiles.length === 0) {
    throw new Error(
      `No skill translation files found in ${translationDirectory} for Build ${args.build}`,
    );
  }

  for (const { filename, gameLanguage, languageDirectory } of languageFiles) {
    if (gameLanguage === "PH" || gameLanguage === "STREW") continue;
    const languageTag = bcp47LanguageTag(gameLanguage);
    const available = usesJsonTranslations
      ? await readJsonSkillTranslations(languageDirectory)
      : await readSkillTranslations(languageDirectory, filename);
    const categoryTranslations = Object.fromEntries(
      Array.from(categories, ([id, translationId]) => [
        id,
        available[translationId],
      ]).filter(([, name]) => typeof name === "string"),
    );
    const skillTranslations = Object.fromEntries(
      Array.from(skills, ([id, translationId]) => [
        id,
        available[translationId],
      ]).filter(([, name]) => typeof name === "string"),
    );
    const outputPath = path.join(outputDirectory, `${languageTag}.json`);
    const formatted = await format(
      JSON.stringify({
        categories: categoryTranslations,
        names: skillTranslations,
      }),
      { parser: "json" },
    );
    await fs.writeFile(outputPath, formatted);
    console.log(
      `${languageTag}: ${Object.keys(categoryTranslations).length}/${categories.size} categories, ${Object.keys(skillTranslations).length}/${skills.size} skills translated`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

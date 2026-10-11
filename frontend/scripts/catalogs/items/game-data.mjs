/* oxlint-disable eslint/no-await-in-loop -- Game data files are read sequentially. */

import fs from "node:fs/promises";
import path from "node:path";
import {
  decodeLuaString,
  findTranslationDirectory,
  readGameTranslationFile,
} from "../../translations/game-files.mjs";

export function displayCategoryTranslations(translations) {
  const prefix = "IGUI_ItemCat_";
  return Object.fromEntries(
    Object.entries(translations)
      .filter(
        ([key, value]) => key.startsWith(prefix) && typeof value === "string",
      )
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );
}

async function isDirectory(directory) {
  try {
    return (await fs.stat(directory)).isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function findGameScriptsDirectory(gameDirectory) {
  const candidates = [
    path.join(gameDirectory, "media", "scripts"),
    path.join(gameDirectory, "projectzomboid", "media", "scripts"),
    path.join(gameDirectory, "Contents", "Java", "media", "scripts"),
    path.join(
      gameDirectory,
      "Contents",
      "Resources",
      "Java",
      "media",
      "scripts",
    ),
  ];

  for (const candidate of candidates) {
    if (await isDirectory(candidate)) return candidate;
  }

  throw new Error(
    `Could not find media${path.sep}scripts inside ${gameDirectory}`,
  );
}

async function textFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await textFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith(".txt"))
      files.push(entryPath);
  }
  return files;
}

function propertyValue(value) {
  // Some Build 41 definitions contain accidental duplicate trailing commas.
  const trimmed = value.trim().replace(/,+$/, "").trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseItemBlocks(content, sourcePath) {
  const lines = content.split(/\r?\n/);
  const items = [];
  let moduleName = null;

  for (let index = 0; index < lines.length; index += 1) {
    const moduleMatch = lines[index].match(/^\s*module\s+(\S+)/);
    if (moduleMatch) moduleName = moduleMatch[1];

    const itemMatch = lines[index].match(/^\s*item\s+(\S+)\s*$/);
    if (!itemMatch || !moduleName) continue;

    let openingLine = index + 1;
    while (openingLine < lines.length && lines[openingLine].trim() === "") {
      openingLine += 1;
    }
    if (lines[openingLine]?.trim() !== "{") continue;

    const properties = {};
    let closingLine = openingLine + 1;
    for (; closingLine < lines.length; closingLine += 1) {
      if (lines[closingLine].trim() === "}") break;
      const propertyMatch = lines[closingLine].match(
        /^\s*([A-Za-z][A-Za-z0-9]*)\s*=\s*(.*?)\s*$/,
      );
      if (propertyMatch) {
        properties[propertyMatch[1]] = propertyValue(propertyMatch[2]);
      }
    }
    if (closingLine === lines.length) {
      throw new Error(
        `Unclosed item ${moduleName}.${itemMatch[1]} in ${sourcePath}`,
      );
    }

    items.push({
      id: `${moduleName}.${itemMatch[1]}`,
      name: itemMatch[1],
      properties,
      sourcePath,
    });
    index = closingLine;
  }

  return items;
}

export async function readGameItems(gameDirectory) {
  const scriptsDirectory = await findGameScriptsDirectory(gameDirectory);
  const definitions = new Map();
  for (const sourcePath of await textFiles(scriptsDirectory)) {
    const content = await fs.readFile(sourcePath, "utf8");
    for (const item of parseItemBlocks(content, sourcePath)) {
      // Actual inventory definitions have both fields. Other script constructs
      // can also use `item` blocks and are intentionally ignored.
      if (
        !(item.properties.ItemType ?? item.properties.Type) ||
        !item.properties.DisplayCategory
      )
        continue;
      const previous = definitions.get(item.id);
      if (previous && previous.sourcePath !== item.sourcePath) {
        throw new Error(`Duplicate game item definition: ${item.id}`);
      }
      // Generated files occasionally redefine an item later in the same file.
      // The game uses the later definition, so the extractor does too.
      definitions.set(item.id, item);
    }
  }
  return definitions;
}

function parseLegacyTranslations(content, keyPattern) {
  return Object.fromEntries(
    content.split(/\r?\n/).flatMap((line) => {
      const match = line.match(keyPattern);
      return match ? [[match[1], decodeLuaString(match[2])]] : [];
    }),
  );
}

export async function readEnglishItemMetadata(gameDirectory, build) {
  const translationDirectory = await findTranslationDirectory(gameDirectory);
  const englishDirectory = path.join(translationDirectory, "EN");
  if (build === "41") {
    const [itemNames, categories] = await Promise.all([
      readGameTranslationFile(englishDirectory, "ItemName_EN.txt"),
      readGameTranslationFile(englishDirectory, "IG_UI_EN.txt"),
    ]);
    return {
      categoryNames: displayCategoryTranslations(
        parseLegacyTranslations(
          categories.content,
          /^\s*(IGUI_ItemCat_\S+)\s*=\s*"(.*)"\s*,?\s*(?:--.*)?$/,
        ),
      ),
      names: parseLegacyTranslations(
        itemNames.content,
        /^\s*ItemName_(\S+)\s*=\s*"(.*)"\s*,?\s*(?:--.*)?$/,
      ),
    };
  }
  if (build !== "42") throw new Error("Build must be 41 or 42");

  const [names, interfaceTranslations] = await Promise.all([
    fs
      .readFile(path.join(englishDirectory, "ItemName.json"), "utf8")
      .then((content) => JSON.parse(content)),
    fs
      .readFile(path.join(englishDirectory, "IG_UI.json"), "utf8")
      .then((content) => JSON.parse(content)),
  ]);
  return {
    categoryNames: displayCategoryTranslations(interfaceTranslations),
    names,
  };
}

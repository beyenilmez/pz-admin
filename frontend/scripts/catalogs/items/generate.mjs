#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";
import { frontendRoot } from "../../shared/paths.mjs";
import { disambiguateItemNames } from "./name-disambiguation.mjs";
import { readEnglishItemMetadata, readGameItems } from "./game-data.mjs";
import { downloadItemWikiImages, scrapeItemWikiCatalog } from "./wiki.mjs";

function parseArgs(argv) {
  const args = {
    build: undefined,
    gameDirectory: undefined,
    output: undefined,
    revision: undefined,
    skipImages: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--build") args.build = argv[++index];
    else if (argument === "--game-dir") args.gameDirectory = argv[++index];
    else if (argument === "--output") args.output = argv[++index];
    else if (argument === "--revision") args.revision = argv[++index];
    else if (argument === "--skip-images") args.skipImages = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (args.build !== "41" && args.build !== "42") {
    throw new Error("Build is required and must be 41 or 42 (--build <build>)");
  }
  if (!args.gameDirectory) {
    throw new Error("Game directory is required (--game-dir <path>)");
  }
  if (
    args.revision !== undefined &&
    args.revision !== "latest" &&
    !/^[1-9]\d*$/.test(args.revision)
  ) {
    throw new Error("Revision must be a positive number or 'latest'");
  }

  return args;
}

function hybridCatalog(wikiCatalog, gameItems, itemNames, categoryNames) {
  const wikiItems = wikiCatalog.categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      wikiCategory: category.name,
    })),
  );
  const items = [];
  const missingDefinitions = [];
  const missingNames = [];

  for (const wikiItem of wikiItems) {
    const gameId = wikiItem.id.replace(/\*$/, "");
    let gameItem = gameItems.get(gameId);
    if (
      !gameItem &&
      wikiItem.id.endsWith("*") &&
      (gameId.startsWith("Base.Mov_") || gameId === "Base.Moveable") &&
      ["Furniture", "Gardening"].includes(wikiItem.wikiCategory)
    ) {
      gameItem = {
        id: gameId,
        name: gameId.slice(gameId.indexOf(".") + 1),
        properties: {
          DisplayCategory: wikiItem.wikiCategory,
        },
      };
    }
    if (!gameItem) {
      missingDefinitions.push(wikiItem.id);
      continue;
    }

    const gameName = itemNames[gameId];
    if (typeof gameName !== "string") missingNames.push(wikiItem.id);
    items.push({
      categoryId: gameItem.properties.DisplayCategory,
      id: wikiItem.id,
      images: wikiItem.images,
      name: gameName ?? wikiItem.name,
    });
  }

  if (missingDefinitions.length > 0) {
    throw new Error(
      `${missingDefinitions.length} wiki items have no game definition:\n${missingDefinitions.join("\n")}`,
    );
  }

  const disambiguatedNames = disambiguateItemNames(items);
  for (const item of items) item.name = disambiguatedNames.get(item.id);

  const itemsByCategory = new Map();
  for (const item of items) {
    const categoryItems = itemsByCategory.get(item.categoryId) ?? [];
    categoryItems.push(item);
    itemsByCategory.set(item.categoryId, categoryItems);
  }
  const categories = Array.from(itemsByCategory, ([id, categoryItems]) => {
    const sortedItems = categoryItems.map(({ categoryId: _, ...item }) => item);
    sortedItems.sort((left, right) =>
      left.name.localeCompare(right.name, "en-US"),
    );
    return {
      id,
      items: sortedItems,
      name: categoryNames[id] ?? id,
    };
  });
  categories.sort((left, right) =>
    left.name.localeCompare(right.name, "en-US"),
  );

  return {
    catalog: {
      build: wikiCatalog.build,
      categories,
    },
    missingNames,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gameDirectory = path.resolve(args.gameDirectory);
  const [{ catalog: wikiCatalog, downloads }, gameItems, englishMetadata] =
    await Promise.all([
      scrapeItemWikiCatalog(args.build, args.revision),
      readGameItems(gameDirectory),
      readEnglishItemMetadata(gameDirectory, args.build),
    ]);

  const { catalog, missingNames } = hybridCatalog(
    wikiCatalog,
    gameItems,
    englishMetadata.names,
    englishMetadata.categoryNames,
  );

  if (!args.skipImages) {
    await downloadItemWikiImages(
      downloads,
      path.join(frontendRoot, "public", "items", args.build),
    );
  }

  const outputPath = path.resolve(
    args.output ??
      path.join(frontendRoot, "src", "data", "items", `${args.build}.json`),
  );
  const formatted = await format(JSON.stringify(catalog), {
    parser: "json",
  });
  await fs.writeFile(outputPath, formatted);

  const itemCount = catalog.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
  console.log(
    `wrote ${outputPath}: ${catalog.categories.length} categories, ${itemCount} items, ${downloads.length} images`,
  );
  if (missingNames.length > 0) {
    console.warn(
      `${missingNames.length} items used their wiki names because the game has no English translation:\n${missingNames.join("\n")}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

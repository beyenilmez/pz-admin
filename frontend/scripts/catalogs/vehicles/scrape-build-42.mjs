#!/usr/bin/env node
/* oxlint-disable eslint/no-await-in-loop -- Wiki requests are deliberately rate-limited. */

// Scrapes the Build 42 Project Zomboid Wiki into `public/vehicles/42`, including
// the folder structure, images, and per-leaf `stats.json` files. Run
// `pnpm generate:vehicles -- --build 42` afterwards to generate the catalog.
//
// Usage: pnpm scrape:vehicles:42
//
// The list page at https://pzwiki.net/wiki/Vehicle contains vehicle and trailer
// tables with a `Vehicle ID` column. Model pages such as `/wiki/Chevalier_D6`
// contain full statistics in an infobox and a variant table. Unlinked variant
// rows represent the base vehicle and use the model page's statistics and image.
// Linked rows use their variant page. Rows with a `Vehicle ID` belonging to
// another listed model are sibling models and are ignored. Variants without an
// `Engine power` statistic are skipped only when the model itself has engine
// power, because trailers legitimately omit it.
//
// Requests go through curl because the wiki blocks Node's HTTP client on TLS
// fingerprinting.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { frontendRoot } from "../../shared/paths.mjs";

const execFileAsync = promisify(execFile);

const WIKI = "https://pzwiki.net";
const LIST_PAGE = `${WIKI}/wiki/Vehicle`;
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
// Maps infobox labels to `stats.json` keys. Labels absent from this map and
// `SKIP_LABELS` are reported at the end.
const STAT_KEYS = {
  Weight: "weight",
  "Engine power": "enginePower",
  "Engine quality": "engineQuality",
  "Engine loudness": "engineLoudness",
  "Top speed": "topSpeed",
  "Suspension stiffness": "suspensionStiffness",
  "Occupant protection": "occupantProtection",
  Seats: "seats",
  Doors: "doors",
  Wheels: "wheels",
  "Glove box capacity": "gloveBox",
  "Trunk capacity": "trunkStorage",
  "Total storage": "totalStorage",
  "Animal size": "animalSize",
  Lightbar: "lightbar",
  "Roll influence": "rollInfluence",
  "Off-road efficiency": "offRoadEfficiency",
};
const SKIP_LABELS = new Set([
  "Manufacturer",
  "Base model",
  "Type",
  "Body",
  "Trunk type",
  "Mesh",
  "Vehicle ID",
]);

async function fetchText(url) {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sS",
      "-L",
      "-A",
      USER_AGENT,
      url,
    ]);
    return stdout;
  } catch (error) {
    throw new Error(`curl failed for ${url}: ${commandError(error)}`, {
      cause: error,
    });
  }
}

async function fetchBuffer(url) {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      ["-sS", "-L", "-A", USER_AGENT, url],
      { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
    );
    return stdout;
  } catch (error) {
    throw new Error(`curl failed for ${url}: ${commandError(error)}`, {
      cause: error,
    });
  }
}

function commandError(error) {
  if (error && typeof error === "object" && "stderr" in error) {
    return String(error.stderr).trim();
  }
  return String(error);
}

const stripTags = (html) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// Decodes percent-encoding in links, such as `Greene%27s` to `Greene's`.
const decodeUri = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function allTables(html) {
  return (html.match(/<table[\s\S]*?<\/table>/gi) ?? []).map((table) =>
    [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]),
  );
}

function rowCells(row) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => ({
    text: stripTags(m[1]),
    html: m[1],
  }));
}

const imgIn = (cellHtml) => cellHtml.match(/src="([^"]+)"/)?.[1] ?? null;

// Converts thumbnail paths such as `/w/images/thumb/7/74/File.png/200px-File.png`
// to their original image path, `/w/images/7/74/File.png`.
const originalImageUrl = (thumbUrl) =>
  thumbUrl.replace(/\/thumb\//, "/").replace(/\/\d+px-[^/]+$/, "");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Infobox parsing

// Parses all `infobox-item` elements as `{ label, value }` sidebar pairs. Inner
// elements carry attributes on some pages, so the matcher remains permissive.
function parseInfobox(html) {
  const stats = {};
  const re =
    /<div class="infobox-item"><div(?:\s[^>]*)?>(.*?)<\/div><div(?:\s[^>]*)?>(.*?)<\/div><\/div>/gs;
  for (const match of html.matchAll(re)) {
    const label = stripTags(match[1]);
    const value = stripTags(match[2]);
    if (SKIP_LABELS.has(label)) continue;
    const key = STAT_KEYS[label];
    if (key) {
      stats[key] = value.replace(/ hp$/i, "");
    } else {
      stats.unknownLabels ??= [];
      stats.unknownLabels.push(label);
    }
  }
  return stats;
}

// Returns the infobox preview image at its original size.
function parseInfoboxImage(html) {
  const at = html.indexOf('class="infobox-image"');
  if (at === -1) return null;
  const img = html.slice(at, at + 1500).match(/<img[^>]+src="([^"]+)"/);
  return img ? originalImageUrl(img[1]) : null;
}

// List and variant table parsing

// Parses rows from a table with a `Vehicle ID` header into
// `{ name, type, id, links, image }`. Images come from each row's thumbnail in
// the first cell because table images survive redirects more reliably than the
// linked pages' infobox images.
function variantRows(html) {
  for (const rows of allTables(html)) {
    const header = rowCells(rows[0] ?? "").map((cell) => cell.text);
    if (!header.includes("Vehicle ID")) continue;
    const out = [];
    for (const row of rows.slice(1)) {
      const cells = rowCells(row);
      if (cells.length < 3) continue;
      const rowImg = imgIn(cells[0]?.html ?? "");
      out.push({
        name: cells[1]?.text ?? "",
        type: cells[2]?.text ?? "",
        id: cells[cells.length - 1]?.text ?? "",
        links: [...cells[1].html.matchAll(/href="(\/wiki\/[^"]+)"/gi)]
          .map((m) => m[1])
          .filter((href) => !href.startsWith("/wiki/File:")),
        image: rowImg ? originalImageUrl(rowImg) : null,
      });
    }
    return out;
  }
  return [];
}

// Go embed excludes names containing apostrophes; preserve them as encoded text.
const sanitize = (name) =>
  name
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/'/g, "%27")
    .trim();

function stripModelSuffix(name, modelName) {
  if (name.endsWith(modelName)) {
    return name.slice(0, -modelName.length).trim();
  }
  return name;
}

// Converts parenthesized names such as `(camo)` to `Camo`.
const stripOuterParens = (name) =>
  name.replace(/^\((.*)\)$/, (_, inner) =>
    inner.replace(/^./, (c) => c.toUpperCase()),
  );

// Extracts `Masonry` from `Chevalier Step Van (masonry)`, or returns an empty
// string when the row does not follow the `<model> (<variant>)` form.
function parenthesizedSuffix(name, modelName) {
  const rest = name.startsWith(modelName)
    ? name.slice(modelName.length).trim()
    : "";
  const match = rest.match(/^\((.*)\)$/);
  return match ? match[1].replace(/^./, (c) => c.toUpperCase()) : "";
}

// Preserves information from the hand-curated Build 41 tree when the wiki's
// short names omit it. Entries are keyed by script ID.
const NAME_OVERRIDES = {
  "Base.CarTaxi": "Taxi (yellow)",
  "Base.CarTaxi2": "Taxi (green)",
};

function leafName(row, modelName, usedNames) {
  if (NAME_OVERRIDES[row.id]) {
    let name = NAME_OVERRIDES[row.id];
    if (usedNames.has(name)) name = `${name} 2`;
    usedNames.add(name);
    return name;
  }
  return deriveName(row, modelName, usedNames);
}

// Variant rows often share the model name, so folder names derive from the
// parenthesized suffix, a name prefix, the variant page title, or a numeric
// collision suffix as a last resort.
function deriveName(row, modelName, usedNames) {
  const stripped = stripModelSuffix(row.name, modelName).trim();
  const pageTitle = row.links[0]
    ? stripModelSuffix(
        decodeUri(row.links[0].replace("/wiki/", "").replace(/_/g, " ")),
        modelName,
      ).trim()
    : "";
  let name =
    parenthesizedSuffix(row.name, modelName) ||
    stripped ||
    parenthesizedSuffix(pageTitle, modelName) ||
    stripOuterParens(pageTitle) ||
    row.name;
  if (usedNames.has(name)) {
    const alt =
      parenthesizedSuffix(pageTitle, modelName) || stripOuterParens(pageTitle);
    name = alt && !usedNames.has(alt) ? alt : `${name} 2`;
  }
  usedNames.add(name);
  return name;
}

// Scraping workflow

async function main() {
  const listHtml = await fetchText(LIST_PAGE);
  const tables = allTables(listHtml).filter((rows) =>
    rowCells(rows[0] ?? "")
      .map((cell) => cell.text)
      .includes("Vehicle ID"),
  );
  if (tables.length !== 2) {
    throw new Error(
      `expected 2 model tables on ${LIST_PAGE}, found ${tables.length}`,
    );
  }
  const [vehicleTable, trailerTable] = tables;

  // Model records use `{ name, type, id, link, category }`.
  const models = [];
  for (const [rows, category] of [
    [vehicleTable, null],
    [trailerTable, "Trailers"],
  ]) {
    for (const row of rows.slice(1)) {
      const cells = rowCells(row);
      if (cells.length < 3) continue;
      const name = cells[1]?.text ?? "";
      if (!name) continue;
      models.push({
        name,
        type: cells[2]?.text ?? "",
        id: cells[cells.length - 1]?.text ?? "",
        link: [...cells[1].html.matchAll(/href="(\/wiki\/[^"]+)"/gi)]
          .map((m) => m[1])
          .find((href) => !href.startsWith("/wiki/File:")),
        category: category ?? cells[2]?.text ?? "Standard",
      });
    }
  }
  console.log(`found ${models.length} models on the list page`);

  const modelIds = new Set(models.map((m) => m.id));
  const buildDirectory = path.join(frontendRoot, "public", "vehicles", "42");
  await mkdir(buildDirectory, { recursive: true });

  const pageCache = new Map(); // url -> html
  async function getPage(url) {
    if (!pageCache.has(url)) {
      pageCache.set(url, await fetchText(`${WIKI}${url}`));
    }
    return pageCache.get(url);
  }

  const imageCache = new Map(); // url -> saved filename
  const skipped = [];
  const unknownLabels = new Set();
  let leaves = 0;

  models.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );

  for (const model of models) {
    const modelUrl = model.link ?? `/wiki/${model.name.replace(/ /g, "_")}`;
    let modelHtml;
    try {
      modelHtml = await getPage(modelUrl);
    } catch (error) {
      console.warn(
        `  ${model.name}: failed to fetch ${modelUrl}: ${String(error)}`,
      );
      continue;
    }
    const modelStats = parseInfobox(modelHtml);
    for (const label of modelStats.unknownLabels ?? [])
      unknownLabels.add(label);
    delete modelStats.unknownLabels;
    const modelHasEngine = modelStats.enginePower !== undefined;
    const modelImage = parseInfoboxImage(modelHtml);

    const rows = variantRows(modelHtml).filter(
      (row) => row.id === model.id || !modelIds.has(row.id),
    );

    // Pages without a variant table are their own single leaf: treat the
    // model itself as the base variant row.
    if (rows.length === 0 && model.id) {
      rows.push({
        name: model.name,
        type: model.type,
        id: model.id,
        links: [],
      });
    }

    const accepted = [];
    const usedNames = new Set();
    for (const row of rows) {
      if (row.type === "Burnt") continue; // Base.*Burnt rows
      if (row.links.length > 0 && row.links[0] !== modelUrl) {
        let pageHtml;
        try {
          pageHtml = await getPage(row.links[0]);
        } catch (error) {
          console.warn(
            `  ${model.name}: failed to fetch ${row.links[0]}: ${String(error)}`,
          );
          continue;
        }
        const stats = parseInfobox(pageHtml);
        for (const label of stats.unknownLabels ?? []) unknownLabels.add(label);
        delete stats.unknownLabels;
        if (modelHasEngine && stats.enginePower === undefined) {
          skipped.push(`${model.name} / ${row.name} (${row.id})`);
          continue;
        }
        accepted.push({
          name: leafName(row, model.name, usedNames),
          id: row.id,
          stats,
          // Prefer the table thumbnail because some variant pages redirect and
          // lose their infobox image.
          image: row.image ?? parseInfoboxImage(pageHtml),
        });
      } else {
        // Base vehicles use the model page's statistics and image. The wiki
        // gives the base variant no distinct name, so it remains `Base Model` to
        // match the hand-curated Build 41 tree.
        let name = "Base Model";
        if (usedNames.has(name)) {
          name = `Base Model ${usedNames.size}`;
        }
        usedNames.add(name);
        accepted.push({
          name,
          id: row.id,
          stats: modelStats,
          image: row.image ?? modelImage,
        });
      }
      await delay(250);
    }

    if (accepted.length === 0) {
      console.warn(`  ${model.name}: no variants accepted`);
      continue;
    }

    const modelDir = path.join(
      buildDirectory,
      sanitize(model.category),
      sanitize(model.name),
    );
    for (const leaf of accepted) {
      // Flattens single-variant models to `{Category}/{Model}/{ScriptId}`.
      const leafDir =
        accepted.length === 1
          ? path.join(modelDir, sanitize(leaf.id))
          : path.join(modelDir, sanitize(leaf.name), sanitize(leaf.id));
      await mkdir(leafDir, { recursive: true });
      await writeFile(
        path.join(leafDir, "stats.json"),
        JSON.stringify(leaf.stats, null, 2) + "\n",
      );

      if (leaf.image) {
        try {
          const filename = imageCache.has(leaf.image)
            ? imageCache.get(leaf.image)
            : `image${path.extname(new URL(`${WIKI}${leaf.image}`).pathname) || ".png"}`;
          imageCache.set(leaf.image, filename);
          const data = await fetchBuffer(`${WIKI}${leaf.image}`);
          await writeFile(path.join(leafDir, filename), data);
        } catch (error) {
          console.warn(
            `  ${model.name} / ${leaf.name}: image download failed: ${String(error)}`,
          );
        }
      } else {
        console.warn(`  ${model.name} / ${leaf.name}: no infobox image`);
      }
      leaves++;
    }
    console.log(
      `  ${model.name}: ${accepted.length} leaf/leaves` +
        (accepted.length === 1 ? ` (${accepted[0].id})` : ""),
    );
    await delay(250);
  }

  console.log(`\ncreated ${leaves} leaves under public/vehicles/42/`);
  if (skipped.length > 0) {
    console.log(
      `skipped ${skipped.length} burnt/wrecked variants (no engine power):`,
    );
    for (const line of skipped.slice(0, 20)) console.log(`  - ${line}`);
    if (skipped.length > 20)
      console.log(`  ... and ${skipped.length - 20} more`);
  }
  if (unknownLabels.size > 0) {
    console.log(`\nunknown infobox labels: ${[...unknownLabels].join(", ")}`);
  }
  console.log(
    "\nrun `pnpm generate:vehicles -- --build 42` to generate the catalog",
  );
}

main().catch((error) => {
  console.error("Error scraping b42 vehicles:", error);
  process.exitCode = 1;
});

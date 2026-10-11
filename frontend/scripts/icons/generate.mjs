import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { load } from "cheerio";
import { frontendRoot } from "../shared/paths.mjs";

const buildRoot = path.resolve(frontendRoot, "../build");
const args = process.argv.slice(2);
assert(
  args.length === 0 || (args.length === 1 && args[0] === "--check"),
  "Usage: node scripts/icons/generate.mjs [--check]",
);
const check = args[0] === "--check";
const source = fs.readFileSync(path.join(buildRoot, "appicon.svg"), "utf8");
const $ = load(source, { xmlMode: true });
assert.equal($("svg").attr("viewBox"), "0 0 512 512");
assert.equal($("#background").length, 1, "Expected one background layer");
assert.equal($("#artwork").length, 1, "Expected one artwork layer");
const background = $("#background").attr("fill");
assert.match(background, /^#[\da-f]{6}$/i, "Use a solid RGB background");

const png = new Resvg(source, {
  fitTo: { mode: "width", value: 1024 },
  font: { loadSystemFonts: false },
}).render();
assert.equal(png.width, 1024);
assert.equal(png.height, 1024);

// Icon Composer owns the outer mask. Preserve artwork placement but remove
// the baked-in rounded background from its foreground layer.
$("#background").remove();
const foreground = `${$.xml().trim()}\n`;
const composerPath = "appicon.icon/icon.json";
const composer = JSON.parse(
  fs.readFileSync(path.join(buildRoot, composerPath), "utf8"),
);
const rgb = background
  .slice(1)
  .match(/.{2}/g)
  .map((channel) => (Number.parseInt(channel, 16) / 255).toFixed(5));
composer.fill = { solid: `srgb:${rgb.join(",")},1.00000` };

/** @type {Array<[string, Buffer]>} */
const outputs = [
  ["appicon.png", png.asPng()],
  ["appicon.icon/Assets/pz-admin.svg", Buffer.from(foreground)],
  [composerPath, Buffer.from(`${JSON.stringify(composer, null, 2)}\n`)],
];
// PNG fallbacks for desktop environments without SVG icon support.
for (const size of [16, 24, 32, 48, 64, 96, 128, 256, 512]) {
  const fallback = new Resvg(source, {
    fitTo: { mode: "width", value: size },
    font: { loadSystemFonts: false },
  }).render();
  assert.equal(fallback.width, size);
  assert.equal(fallback.height, size);
  outputs.push([`linux/icons/${size}x${size}/pz-admin.png`, fallback.asPng()]);
}
let changed = 0;
for (const [relativePath, contents] of outputs) {
  const target = path.join(buildRoot, relativePath);
  if (fs.existsSync(target) && fs.readFileSync(target).equals(contents))
    continue;
  if (check)
    throw new Error(`${relativePath} is stale; run pnpm generate:icons`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  changed++;
}
console.log(
  check
    ? "Icon source exports are up to date."
    : `Updated ${changed} icon source exports.`,
);

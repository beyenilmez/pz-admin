import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { frontendRoot } from "../shared/paths.mjs";

const mode = process.argv[2];
if (!["--write", "--check"].includes(mode) || process.argv.length !== 3) {
  throw new Error(
    "Usage: node scripts/translations/format.mjs --write|--check",
  );
}

const root = join(frontendRoot, "src/i18n/resources");
let changed = 0;
for (const locale of readdirSync(root, { withFileTypes: true })) {
  if (!locale.isDirectory()) continue;
  const directory = join(root, locale.name);
  for (const file of readdirSync(directory).filter((name) =>
    name.endsWith(".json"),
  )) {
    const path = join(directory, file);
    const source = readFileSync(path, "utf8");
    const formatted = `${JSON.stringify(sortKeys(JSON.parse(source)), null, 2)}\n`;
    if (source === formatted) continue;
    changed++;
    if (mode === "--write") writeFileSync(path, formatted, "utf8");
    console.log(relative(frontendRoot, path));
  }
}

if (mode === "--check" && changed > 0) {
  console.error("Run pnpm format:translations to format translation files.");
  process.exitCode = 1;
} else {
  console.log(`Translation formatting: ${changed} file(s) changed.`);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .toSorted()
      .map((key) => [key, sortKeys(value[key])]),
  );
}

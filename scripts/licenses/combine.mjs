import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const target = process.argv[2] ?? `${process.platform}-${process.arch}`;
const licenseRoot = path.join(root, ".generated", "licenses");
const frontendFile = path.join(licenseRoot, "frontend", "dependencies.json");
const backendRoot = path.join(licenseRoot, "backend", target);
const backendCsv = path.join(backendRoot, "dependencies.csv");
const backendTexts = path.join(backendRoot, "texts");
const applicationInput = path.join(
  root,
  "scripts",
  "licenses",
  "application.json",
);
const staticPlatformInput = path.join(
  root,
  "scripts",
  "licenses",
  "platform",
  `${target.split("-")[0]}.json`,
);
const output = path.join(licenseRoot, "THIRD-PARTY-NOTICES.json");

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

function parseCsvLine(line) {
  const parts = line.split(",");
  if (parts.length !== 3)
    throw new Error(`Invalid backend license row: ${line}`);
  const [name, source, identifier] = parts;
  return { name, source, identifier };
}

async function backendEntries() {
  const rows = (await readFile(backendCsv, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      text: await readFile(
        path.join(backendTexts, row.name, "LICENSE"),
        "utf8",
      ),
    })),
  );
}

async function readNoticeEntries(file, optional = false) {
  let manifest;
  try {
    manifest = await readJson(file);
  } catch (error) {
    if (optional && error.code === "ENOENT") return [];
    throw error;
  }

  if (!Array.isArray(manifest)) {
    throw new Error(`License manifest must be an array: ${file}`);
  }

  return Promise.all(
    manifest.map(async (entry) => {
      const { file: textFile, files, ...notice } = entry;
      const textFiles = files ?? (textFile ? [textFile] : []);
      if (!textFiles.length) return notice;
      const texts = await Promise.all(
        textFiles.map((textPath) =>
          readFile(path.resolve(path.dirname(file), textPath), "utf8"),
        ),
      );
      return {
        ...notice,
        text: texts.join("\n\n"),
      };
    }),
  );
}

const platformEntries = await readNoticeEntries(staticPlatformInput, true);
const combined = [
  ...(await readNoticeEntries(applicationInput)),
  ...(await readJson(frontendFile)),
  ...(await backendEntries()),
  ...platformEntries,
];
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(combined, null, 2)}\n`);
console.log(
  `Wrote ${combined.length} license entries to ${path.relative(root, output)}`,
);

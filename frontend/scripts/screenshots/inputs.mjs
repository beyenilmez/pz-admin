import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { frontendRoot } from "../shared/paths.mjs";
import { hashFiles } from "../shared/hash.mjs";

// Include source inputs, not dependencies or generated build/capture output.
const inputs = [
  "frontend/*",
  "frontend/.*",
  "frontend/.storybook/**/*",
  "frontend/src/**/*",
  "frontend/bindings/**/*",
  "frontend/public/**/*",
  "frontend/scripts/screenshots/**/*",
  "frontend/scripts/shared/**/*",
  "build/appicon.svg",
];

export async function screenshotInputHash(root = path.dirname(frontendRoot)) {
  return hashFiles(root, inputs);
}

export async function screenshotsCurrent(output, inputHash) {
  try {
    const manifest = JSON.parse(
      await readFile(path.join(output, "manifest.json"), "utf8"),
    );
    if (manifest.inputHash !== inputHash || !manifest.images?.length)
      return false;
    if (manifest.images.some(({ files }) => !files?.length)) return false;
    const outputs = [
      "README.md",
      ...manifest.images.flatMap(({ files }) => files.map((file) => file.path)),
    ];
    const stats = await Promise.all(
      outputs.map((file) => stat(path.join(output, file))),
    );
    return stats.every((info) => info.isFile() && info.size > 0);
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return false;
    throw error;
  }
}

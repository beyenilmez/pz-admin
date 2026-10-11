import { createHash } from "node:crypto";
import { glob, readFile, stat } from "node:fs/promises";
import path from "node:path";

export async function hashFiles(root, patterns) {
  const filenames = [];
  for await (const filename of glob(patterns, { cwd: root })) {
    if ((await stat(path.join(root, filename))).isFile())
      filenames.push(filename);
  }
  const hash = createHash("sha256");
  // Sorting and portable paths keep hashes stable across checkouts.
  for (const filename of filenames.toSorted((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    // Read one asset at a time to bound memory use for large asset collections.
    // eslint-disable-next-line no-await-in-loop
    const data = await readFile(path.join(root, filename));
    hash.update(filename.split(path.sep).join("/"));
    hash.update("\0");
    hash.update(createHash("sha256").update(data).digest());
  }
  return hash.digest("hex");
}

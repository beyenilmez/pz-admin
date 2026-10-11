import { readdir, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const readme = `# Generated screenshots

Do not edit files in this directory by hand. Configure images, formats, sizes,
and ordering in [screenshots.json](../../frontend/.storybook/screenshots.json),
then run \`wails3 task screenshots\` from the repository root.

Unchanged inputs are skipped. Use \`wails3 task screenshots -- --force\` to
regenerate, or \`-- --check\` to validate all scenes without saving images.

A successful export replaces the manifest and removes obsolete files and empty
folders. This README is generated too.
`;

export async function saveManifest(output, manifest) {
  const keep = new Set([
    path.join(output, "manifest.json"),
    path.join(output, "README.md"),
    ...manifest.images.flatMap(({ files }) =>
      files.map((file) => path.join(output, file.path)),
    ),
  ]);
  await writeFile(
    path.join(output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(path.join(output, "README.md"), readme);

  async function cleanup(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) await cleanup(filename);
        else if (!keep.has(filename)) await unlink(filename);
      }),
    );
    if (directory !== output && (await readdir(directory)).length === 0) {
      await rmdir(directory);
    }
  }
  await cleanup(output);
}

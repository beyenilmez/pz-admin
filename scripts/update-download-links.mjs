import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const version = (await readFile(new URL("VERSION", root), "utf8")).trim();
const readme = new URL("README.md", root);
const contents = await readFile(readme, "utf8");
const updated = contents.replace(
  /\/releases\/download\/v?([^/"\s]+)\/pz-admin-\1(?=[.-])/g,
  `/releases/download/v${version}/pz-admin-${version}`,
);
if (updated !== contents) await writeFile(readme, updated);

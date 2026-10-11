import { execFileSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("../../", import.meta.url));
const output = path.join(root, ".generated/flatpak");
const manifest = "com.bedirhanyenilmez.pzadmin.yml";
const { values } = parseArgs({ options: { git: { type: "boolean" } } });

await mkdir(output, { recursive: true });

let source;
let sourceRef = process.env.SOURCE_REF || process.env.RELEASE_TAG || "";
if (values.git) {
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  source = {
    type: "git",
    url: execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    tag: process.env.RELEASE_TAG || undefined,
    commit,
  };
  sourceRef ||= commit;
} else {
  execFileSync(
    "tar",
    [
      "--create",
      "--file",
      path.join(output, "app-source.tar"),
      "--exclude-vcs",
      "--exclude-vcs-ignores",
      ".",
    ],
    { cwd: root, stdio: "inherit" },
  );
  source = { type: "archive", path: "app-source.tar", "strip-components": 0 };
}

await copyFile(
  path.join(root, "build/linux/flatpak", manifest),
  path.join(output, manifest),
);
await writeFile(
  path.join(output, "app-sources.json"),
  `${JSON.stringify(
    [
      source,
      {
        type: "inline",
        "dest-filename": "SOURCE_REF",
        contents: sourceRef,
      },
      {
        type: "inline",
        "dest-filename": "SOURCE_REPOSITORY",
        contents: process.env.SOURCE_REPOSITORY || source.url || "",
      },
    ],
    null,
    2,
  )}\n`,
);
console.log(`Prepared Flatpak build files in ${output}`);

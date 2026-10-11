import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const output = path.join(root, ".generated/flatpak");
const goGenerator = "github.com/dennwc/flatpak-go-mod@v0.1.0";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
}

async function readJson(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}

function pnpmStoreVersion(version) {
  const args = ["exec", `npm:pnpm@${version}`, "--", "pnpm"];
  const options = { cwd: path.join(root, "frontend") };
  const actualVersion = run("mise", [...args, "--version"], options).trim();
  if (actualVersion !== version)
    throw new Error(
      "The active pnpm version does not match the locked version",
    );
  const storePath = run(
    "mise",
    [...args, "store", "path", "--silent"],
    options,
  ).trim();
  const storeVersion = path.basename(storePath);
  if (!/^v\d+$/.test(storeVersion))
    throw new Error(`Unrecognized pnpm store format: ${storeVersion}`);
  return storeVersion;
}

async function copyGoProject(destination) {
  await mkdir(destination);
  const filenames = run("git", [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "--deduplicate",
    "-z",
    "*.go",
    "go.mod",
    "go.sum",
  ])
    .split("\0")
    .filter(Boolean);

  for (const filename of filenames) {
    const source = path.join(root, filename);
    const info = await stat(source).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    if (!info?.isFile()) continue;
    const target = path.join(destination, filename);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

async function goSources(source, directory, destination = "") {
  await mkdir(directory);
  run(
    "go",
    [
      "run",
      goGenerator,
      "-json",
      "-out",
      directory,
      "-dest-pref",
      destination,
      source,
    ],
    { stdio: "inherit" },
  );
  const sources = await readJson(path.join(directory, "go.mod.json"));
  const metadata = sources.filter(
    (entry) => entry.type === "file" && entry.path === "modules.txt",
  );
  if (metadata.length !== 1)
    throw new Error(
      `Expected one modules.txt source entry; found ${metadata.length}`,
    );

  // Embed vendor metadata so the source list has no temporary file paths.
  sources[sources.indexOf(metadata[0])] = {
    type: "inline",
    dest: metadata[0].dest,
    "dest-filename": "modules.txt",
    contents: await readFile(path.join(directory, "modules.txt"), "utf8"),
  };
  return sources;
}

async function collectorSources(version, work) {
  const module = "github.com/google/go-licenses/v2";
  const collector = JSON.parse(
    run("go", ["mod", "download", "-json", `${module}@${version}`]),
  );
  const source = path.join(work, "go-licenses-source");
  await cp(collector.Dir, source, { recursive: true });
  // Go's module cache is read-only; allow vendor generation and later cleanup.
  await chmod(source, 0o755);
  for (const entry of await readdir(source, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (entry.isDirectory())
      await chmod(path.join(entry.parentPath, entry.name), 0o755);
  }

  const destination = ".flatpak/go-licenses-source";
  const archive = {
    type: "archive",
    url: `https://proxy.golang.org/${module}/@v/${version}.zip`,
    sha256: createHash("sha256")
      .update(await readFile(collector.Zip))
      .digest("hex"),
    "strip-components": 4,
    dest: destination,
  };
  const dependencies = await goSources(
    source,
    path.join(work, "go-licenses-metadata"),
    `${destination}/`,
  );
  return [archive, ...dependencies];
}

async function pnpmSource(version) {
  const response = await fetch(`https://registry.npmjs.org/pnpm/${version}`);
  if (!response.ok)
    throw new Error(`Cannot fetch pnpm metadata: HTTP ${response.status}`);
  const { dist } = await response.json();
  const [algorithm, digest] = dist.integrity.split("-", 2);
  if (algorithm !== "sha512")
    throw new Error("Expected SHA-512 integrity for pnpm");
  return {
    type: "archive",
    url: dist.tarball,
    // npm uses Base64 digests; Flatpak expects hexadecimal.
    sha512: Buffer.from(digest, "base64").toString("hex"),
    dest: ".flatpak/pnpm",
  };
}

async function frontendSources(storeVersion, filename) {
  run(
    "flatpak",
    [
      "run",
      "--command=flatpak-node-generator",
      "org.flatpak.Builder",
      "pnpm",
      path.join(root, "frontend/pnpm-lock.yaml"),
      "--pnpm-store-version",
      storeVersion,
      "-o",
      filename,
    ],
    { stdio: "inherit" },
  );
  const sources = await readJson(filename);
  // Stabilize concurrent downloads while preserving setup instruction order.
  const downloads = sources.filter((source) => source.url);
  const setup = sources.filter((source) => !source.url);
  downloads.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  return [...downloads, ...setup];
}

const tools = JSON.parse(run("mise", ["ls", "--current", "--local", "--json"]));
const pnpmVersion = tools["npm:pnpm"][0].version;
const storeVersion = pnpmStoreVersion(pnpmVersion);
const collectorVersion = `v${tools["go:github.com/google/go-licenses/v2"][0].version.replace(/^v/, "")}`;

await mkdir(output, { recursive: true });
const work = await mkdtemp(path.join(output, "sources-"));
try {
  // Isolate Go's vendor generation from the working checkout.
  const appSource = path.join(work, "app-source");
  await copyGoProject(appSource);
  const sources = await goSources(
    appSource,
    path.join(work, "app-go-metadata"),
  );
  sources.push(...(await collectorSources(collectorVersion, work)));
  sources.push(await pnpmSource(pnpmVersion));
  sources.push(
    ...(await frontendSources(storeVersion, path.join(work, "node.json"))),
  );
  await writeFile(
    path.join(output, "dependency-sources.json"),
    `${JSON.stringify(sources, null, 2)}\n`,
  );
} finally {
  await rm(work, { recursive: true, force: true });
}
console.log("Generated .generated/flatpak/dependency-sources.json");

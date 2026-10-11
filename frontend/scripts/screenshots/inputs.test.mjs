import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { screenshotInputHash, screenshotsCurrent } from "./inputs.mjs";

const directories = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "pz-screenshot-inputs-"));
  directories.push(root);
  return root;
}

async function write(root, filename, contents = "input") {
  const target = path.join(root, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}

it("changes the hash for source edits but ignores generated output and tool versions", async () => {
  const root = await fixture();
  await write(root, "frontend/src/app.tsx", "original");
  const original = await screenshotInputHash(root);
  await write(root, "frontend/storybook-static/index.html");
  await write(root, "assets/screenshots/manifest.json");
  await write(root, "mise.lock");
  expect(await screenshotInputHash(root)).toBe(original);
  await write(root, "frontend/src/app.tsx", "changed");
  expect(await screenshotInputHash(root)).not.toBe(original);
});

it("requires a matching hash and existing screenshot files", async () => {
  const output = await fixture();
  const manifest = {
    inputHash: "current",
    images: [{ files: [{ path: "players.png" }] }],
  };
  await write(output, "manifest.json", JSON.stringify(manifest));
  await write(output, "README.md");
  await write(output, "players.png");
  expect(await screenshotsCurrent(output, "current")).toBe(true);
  expect(await screenshotsCurrent(output, "changed")).toBe(false);
  await rm(path.join(output, "players.png"));
  expect(await screenshotsCurrent(output, "current")).toBe(false);
});

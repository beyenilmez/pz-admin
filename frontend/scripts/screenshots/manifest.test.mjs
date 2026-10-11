import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { saveManifest } from "./manifest.mjs";

const directories = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

it("keeps current outputs and removes stale files and empty folders without reading the old manifest", async () => {
  const output = await mkdtemp(path.join(tmpdir(), "pz-screenshot-manifest-"));
  directories.push(output);
  await mkdir(path.join(output, "players/en-US"), { recursive: true });
  await mkdir(path.join(output, "removed/en-US"), { recursive: true });
  await Promise.all(
    [
      "players/en-US/current.png",
      "players/en-US/old.webp",
      "removed/en-US/old.png",
      "untracked.png",
      "manifest.json",
      "manifest.json.tmp",
    ].map((file) => writeFile(path.join(output, file), "old")),
  );
  const manifest = {
    images: [{ files: [{ path: "players/en-US/current.png" }] }],
  };
  await saveManifest(output, manifest);
  expect((await readdir(output)).toSorted()).toEqual([
    "README.md",
    "manifest.json",
    "players",
  ]);
  expect(await readdir(path.join(output, "players/en-US"))).toEqual([
    "current.png",
  ]);
  expect(
    await readFile(path.join(output, "players/en-US/current.png"), "utf8"),
  ).toBe("old");
  expect(
    JSON.parse(await readFile(path.join(output, "manifest.json"), "utf8")),
  ).toEqual(manifest);
  expect(await readFile(path.join(output, "README.md"), "utf8")).toContain(
    "Do not edit files in this directory by hand.",
  );
});

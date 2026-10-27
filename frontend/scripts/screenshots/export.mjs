import { execSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { preview } from "vite";
import { frontendRoot } from "../shared/paths.mjs";
import {
  readMetadataTranslations,
  screenshotText,
} from "../shared/metadata.mjs";
import { defaultLanguage } from "../../src/i18n/locales.ts";
import { screenshotLanguages } from "./languages.mjs";
import { prepareStory } from "./storybook.mjs";
import { validateOutputs, writeImages } from "./images.mjs";
import { saveManifest } from "./manifest.mjs";
import { screenshotInputHash, screenshotsCurrent } from "./inputs.mjs";
import { captureProfiles } from "./captures.mjs";

const { values } = parseArgs({
  options: {
    check: { type: "boolean" },
    force: { type: "boolean" },
  },
});
const config = JSON.parse(
  await readFile(
    path.join(frontendRoot, ".storybook/screenshots.json"),
    "utf8",
  ),
);
if (!config.images.includes(config.main)) {
  throw new Error("Main screenshot must be in images.");
}
const output = path.resolve(frontendRoot, "../assets/screenshots");
validateOutputs(config.outputs);
const profiles = captureProfiles(config);

async function exportScene(browser, options) {
  const context = await browser.newContext({
    viewport: options.dimensions,
    deviceScaleFactor: 1,
    timezoneId: "UTC",
  });
  try {
    const page = await context.newPage();
    // Keep timestamps stable so release PRs only contain meaningful image changes.
    await page.clock.setFixedTime(new Date("2004-09-22T12:00:00Z"));
    const captureTarget = await prepareStory(page, options);
    if (values.check) return [];
    return await writeImages(page, captureTarget, {
      ...options,
      output,
    });
  } finally {
    await context.close();
  }
}

async function run() {
  const translationsByLanguage = await readMetadataTranslations();
  const screenshotEntries = config.images.map((id) => ({
    id,
    ...screenshotText(id, translationsByLanguage),
    files: [],
  }));
  const inputHash = await screenshotInputHash();
  if (
    !values.check &&
    !values.force &&
    (await screenshotsCurrent(output, inputHash))
  ) {
    console.log(
      "Screenshots are up to date; skipping Storybook build and capture.",
    );
    return;
  }
  execSync("pnpm storybook:build", {
    cwd: frontendRoot,
    stdio: "inherit",
  });
  const languages = await screenshotLanguages();
  const manifest = {
    inputHash,
    themes: config.themes,
    main: config.main,
    defaultLanguage,
    images: screenshotEntries,
  };
  const index = JSON.parse(
    await readFile(
      path.join(frontendRoot, "storybook-static/index.json"),
      "utf8",
    ),
  );
  for (const id of config.images) {
    const story = `showcases-application--${id}`;
    if (index.entries[story]?.type !== "story")
      throw new Error(`Missing built story: ${story}`);
  }
  const server = await preview({
    configFile: false,
    root: frontendRoot,
    build: { outDir: "storybook-static" },
    preview: { host: "127.0.0.1", port: 0, open: false },
  });
  let browser;
  try {
    // A failed export must not leave a reusable hash beside partially replaced images.
    if (!values.check)
      await rm(path.join(output, "manifest.json"), { force: true });
    browser = await chromium.launch();
    // Each scene gets isolated storage and mocks; sequential captures bound memory use.
    /* eslint-disable no-await-in-loop */
    for (const locale of languages) {
      for (const scene of manifest.images) {
        const { id } = scene;
        for (const profile of profiles) {
          for (const theme of config.themes) {
            const files = await exportScene(browser, {
              ...profile,
              serverUrl: server.resolvedUrls.local[0],
              id,
              story: `showcases-application--${id}`,
              theme,
              language: locale,
            });
            scene.files.push(...files);
            console.log(
              `${values.check ? "Checked" : "Captured"} ${id} (${locale}, ${theme}, ${profile.presentation})`,
            );
          }
        }
      }
    }
    /* eslint-enable no-await-in-loop */
    if (!values.check) {
      await saveManifest(output, manifest);
    }
  } finally {
    try {
      await browser?.close();
    } finally {
      await new Promise((resolve, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }
}

await run();

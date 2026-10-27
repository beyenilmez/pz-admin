import { access } from "node:fs/promises";
import path from "node:path";
import { escapeXml, languageAttribute } from "./xml.mjs";

function buildCaptionsXml(id, captions, defaultLanguage) {
  if (!captions?.[defaultLanguage]) {
    throw new Error(`Missing ${defaultLanguage} caption for ${id}`);
  }
  return Object.entries(captions)
    .map(([language, caption]) => {
      if (
        !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language) ||
        typeof caption !== "string" ||
        !caption.trim()
      ) {
        throw new Error(`Invalid ${language} caption for ${id}`);
      }
      const lang = languageAttribute(language, defaultLanguage);
      return `      <caption${lang}>${escapeXml(caption)}</caption>`;
    })
    .join("\n");
}

// Use the largest PNG for each language/theme.
function selectPngSources(id, files) {
  const sources = new Map();
  for (const file of files) {
    if (file.format !== "png") continue;
    const key = `${file.language}:${file.theme}`;
    const current = sources.get(key);
    if (!current || file.width > current.width) {
      sources.set(key, file);
    }
  }
  for (const file of files) {
    if (!sources.has(`${file.language}:${file.theme}`)) {
      throw new Error(
        `Missing ${file.language} ${file.theme} PNG source image for ${id}`,
      );
    }
  }
  return [...sources.values()];
}

export async function buildScreenshotsXml(
  screenshotManifest,
  {
    presentation,
    environment,
    repositoryUrl,
    releaseVersion,
    directory,
    sourceRef = `v${releaseVersion}`,
  },
) {
  if (!screenshotManifest) return "";
  const { defaultLanguage } = screenshotManifest;
  const project = new URL(repositoryUrl);
  if (project.hostname !== "github.com") {
    throw new Error("Screenshot hosting requires a GitHub vcs-browser URL");
  }
  const projectPath = project.pathname.replace(/\/$/, "").replace(/\.git$/, "");
  const screenshotBaseUrl = new URL(
    `https://raw.githubusercontent.com${projectPath}/${sourceRef}/assets/screenshots/`,
  );
  if (typeof environment !== "string" || !/^[a-z][a-z-]*$/.test(environment)) {
    throw new Error(
      "Screenshot environment must be a desktop ID, such as gnome or plasma",
    );
  }
  const matchingImages = screenshotManifest.images
    .map((image) => ({
      ...image,
      files: image.files.filter((file) => file.presentation === presentation),
    }))
    .filter((image) => image.files.length > 0);
  if (!matchingImages.some(({ id }) => id === screenshotManifest.main)) {
    throw new Error(`Main screenshot must have ${presentation} images`);
  }
  const ids = new Set();
  const screenshots = matchingImages.map(({ id, captions, files }) => {
    if (
      typeof id !== "string" ||
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      ids.has(id)
    ) {
      throw new Error(`Invalid or duplicate screenshot ID: ${id}`);
    }
    ids.add(id);
    const captionElements = buildCaptionsXml(id, captions, defaultLanguage);
    const type = id === screenshotManifest.main ? ' type="default"' : "";
    return { id, type, captionElements, files: selectPngSources(id, files) };
  });
  for (const { files } of screenshots) {
    for (const file of files) {
      await access(path.join(directory, file.path)).catch(() => {
        throw new Error(
          `Missing assets/screenshots/${file.path}; run the screenshots task before packaging`,
        );
      });
    }
  }
  const images = screenshotManifest.themes.flatMap((theme) => {
    return screenshots.map(({ id, type, captionElements, files }) => {
      const environmentAttribute =
        theme === "dark" ? ` environment="${environment}:dark"` : "";
      const sources = files.filter((file) => file.theme === theme);
      if (!sources.some(({ language }) => language === defaultLanguage)) {
        throw new Error(
          `Missing ${defaultLanguage} ${theme} PNG source image for ${id}`,
        );
      }
      const variants = sources.map(
        ({ language, path: file, width, height }) => {
          const lang = languageAttribute(language, defaultLanguage);
          const url = new URL(file, screenshotBaseUrl).href;
          return `      <image type="source" width="${width}" height="${height}"${lang}>${escapeXml(url)}</image>`;
        },
      );
      return `    <screenshot${type}${environmentAttribute}>\n${captionElements}\n${variants.join("\n")}\n    </screenshot>`;
    });
  });
  return `  <screenshots>\n${images.join("\n")}\n  </screenshots>\n`;
}

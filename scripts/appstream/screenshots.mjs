import { access } from "node:fs/promises";
import path from "node:path";

const desktopEnvironment = "gnome";

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
      const lang =
        language === defaultLanguage ? "" : ` xml:lang="${language}"`;
      return `      <caption${lang}>${escapeXml(caption)}</caption>`;
    })
    .join("\n");
}

// Use the largest output for each language/theme, preferring PNG at equal size.
function selectSourceImages(files) {
  const sources = new Map();
  for (const file of files) {
    if (!["png", "webp"].includes(file.format)) continue;
    const key = `${file.language}:${file.theme}`;
    const current = sources.get(key);
    if (
      !current ||
      file.width > current.width ||
      (file.width === current.width && file.format === "png")
    ) {
      sources.set(key, file);
    }
  }
  return [...sources.values()];
}

export async function buildScreenshotsXml(
  screenshots,
  { repository, version, directory, ref = `v${version}` },
) {
  if (!screenshots) return "";
  const { defaultLanguage } = screenshots;
  const project = new URL(repository);
  if (project.hostname !== "github.com") {
    throw new Error("Screenshot hosting requires a GitHub vcs-browser URL");
  }
  const projectPath = project.pathname.replace(/\/$/, "").replace(/\.git$/, "");
  const base = new URL(
    `https://raw.githubusercontent.com${projectPath}/${ref}/assets/screenshots/`,
  );
  if (!screenshots.images.some(({ id }) => id === screenshots.main)) {
    throw new Error("Main screenshot must be in images");
  }
  if (!/^[a-z][a-z-]*$/.test(desktopEnvironment)) {
    throw new Error(
      "Screenshot environment must be a desktop ID, such as gnome or plasma",
    );
  }
  const ids = new Set();
  const scenes = screenshots.images.map(({ id, captions, files }) => {
    if (
      typeof id !== "string" ||
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      ids.has(id)
    ) {
      throw new Error(`Invalid or duplicate screenshot ID: ${id}`);
    }
    ids.add(id);
    const captionElements = buildCaptionsXml(id, captions, defaultLanguage);
    const type = id === screenshots.main ? ' type="default"' : "";
    return { id, type, captionElements, files: selectSourceImages(files) };
  });
  for (const { files } of scenes) {
    for (const file of files) {
      await access(path.join(directory, file.path)).catch(() => {
        throw new Error(
          `Missing assets/screenshots/${file.path}; run the screenshots task before packaging`,
        );
      });
    }
  }
  const images = screenshots.themes.flatMap((theme) => {
    return scenes.map(({ id, type, captionElements, files }) => {
      const environment =
        theme === "dark" ? ` environment="${desktopEnvironment}:dark"` : "";
      const sources = files.filter((file) => file.theme === theme);
      if (!sources.some(({ language }) => language === defaultLanguage)) {
        throw new Error(
          `Missing ${defaultLanguage} ${theme} source image for ${id}`,
        );
      }
      const variants = sources.map(
        ({ language, path: file, width, height }) => {
          // Untagged English is the fallback for locales without a translated image.
          const lang =
            language === defaultLanguage ? "" : ` xml:lang="${language}"`;
          const url = new URL(file, base).href;
          return `      <image type="source" width="${width}" height="${height}"${lang}>${escapeXml(url)}</image>`;
        },
      );
      return `    <screenshot${type}${environment}>\n${captionElements}\n${variants.join("\n")}\n    </screenshot>`;
    });
  });
  return `  <screenshots>\n${images.join("\n")}\n  </screenshots>\n`;
}

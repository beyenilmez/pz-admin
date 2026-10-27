import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function validateOutputs(outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    throw new Error("Configure at least one screenshot output.");
  }
  const seen = new Set();
  for (const { presentation, format, width, quality } of outputs) {
    if (!["desktop", "mobile"].includes(presentation)) {
      throw new Error(
        "Screenshot outputs need a desktop or mobile presentation.",
      );
    }
    if (
      !["png", "webp"].includes(format) ||
      !Number.isInteger(width) ||
      width < 1
    ) {
      throw new Error(
        "Screenshot outputs need a png/webp format and a positive integer width.",
      );
    }
    if (
      quality !== undefined &&
      (format !== "webp" ||
        !Number.isFinite(quality) ||
        quality < 0 ||
        quality > 100)
    ) {
      throw new Error(
        "Screenshot quality is only supported for WebP and must be between 0 and 100.",
      );
    }
    const key = `${presentation}:${format}:${width}`;
    if (seen.has(key)) throw new Error(`Duplicate screenshot output: ${key}`);
    seen.add(key);
  }
}

// Chromium supplies resizing and encoding without another dependency.
async function encodeImage(page, png, variant) {
  const dataUrl = await page.evaluate(
    async ({ source, width: targetWidth, format, quality }) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = Math.max(
        1,
        Math.round((image.naturalHeight * targetWidth) / image.naturalWidth),
      );
      const context = canvas.getContext("2d");
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL(`image/${format}`, quality / 100);
    },
    {
      source: `data:image/png;base64,${png.toString("base64")}`,
      quality: 90,
      ...variant,
    },
  );
  if (!dataUrl.startsWith(`data:image/${variant.format};base64,`))
    throw new Error(`${variant.format} encoding failed.`);
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

export async function writeImages(
  page,
  captureTarget,
  { output, id, language, theme, dimensions, outputs },
) {
  const png = await captureTarget.screenshot({
    animations: "disabled",
    caret: "hide",
    omitBackground: true,
    style: "html, body { background: transparent !important; }",
  });
  await mkdir(path.join(output, id, language), { recursive: true });
  return Promise.all(
    outputs.map(async (variant) => {
      const { presentation, format, width } = variant;
      const height = Math.max(
        1,
        Math.round((dimensions.height * width) / dimensions.width),
      );
      const data =
        format === "png" && width === dimensions.width
          ? png
          : await encodeImage(page, png, variant);
      const filename = `${id}-${presentation}-${language}-${theme}-${width}x${height}.${format}`;
      const relativePath = `${id}/${language}/${filename}`;
      await writeFile(path.join(output, relativePath), data);
      return {
        presentation,
        language,
        theme,
        format,
        width,
        height,
        path: relativePath,
      };
    }),
  );
}

/* oxlint-disable eslint/no-await-in-loop -- Game translation files are read sequentially. */

import fs from "node:fs/promises";
import path from "node:path";
const TRANSLATE_PATH = ["media", "lua", "shared", "Translate"];

const languageTagByGameLanguage = {
  AR: "es-AR",
  CA: "ca",
  CH: "zh-Hant",
  CN: "zh-Hans",
  CS: "cs",
  DA: "da",
  DE: "de",
  EN: "en-US",
  ES: "es-ES",
  ES_CL: "es-CL",
  ES_MX: "es-MX",
  FI: "fi",
  FR: "fr",
  HU: "hu",
  ID: "id",
  IT: "it",
  JP: "ja",
  KO: "ko",
  NL: "nl",
  NO: "no",
  PL: "pl",
  PT: "pt-PT",
  PTBR: "pt-BR",
  RO: "ro",
  RU: "ru",
  TH: "th",
  TR: "tr-TR",
  UA: "uk-UA",
};

export function bcp47LanguageTag(gameLanguage) {
  const configuredTag = languageTagByGameLanguage[gameLanguage];
  if (!configuredTag) {
    throw new Error(`No BCP 47 language tag for game language ${gameLanguage}`);
  }

  try {
    return Intl.getCanonicalLocales(configuredTag)[0];
  } catch {
    throw new Error(
      `Invalid BCP 47 language tag ${configuredTag} for game language ${gameLanguage}`,
    );
  }
}

async function isDirectory(directory) {
  try {
    return (await fs.stat(directory)).isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function findTranslationDirectory(gameDirectory) {
  const candidates = [
    gameDirectory,
    path.join(gameDirectory, ...TRANSLATE_PATH),
    path.join(gameDirectory, "projectzomboid", ...TRANSLATE_PATH),
    path.join(gameDirectory, "Contents", "Java", ...TRANSLATE_PATH),
    path.join(
      gameDirectory,
      "Contents",
      "Resources",
      "Java",
      ...TRANSLATE_PATH,
    ),
  ];

  for (const candidate of candidates) {
    if (await isDirectory(candidate)) {
      const entries = await fs.readdir(candidate);
      if (entries.includes("EN") && entries.includes("TR")) return candidate;
    }
  }

  throw new Error(
    `Could not find ${TRANSLATE_PATH.join(path.sep)} inside ${gameDirectory}`,
  );
}

function normalizeCharset(charset, bytes) {
  const normalized = charset.toLowerCase().replaceAll("_", "-");
  const codePage = normalized.match(/^cp(\d+)$/)?.[1];
  if (codePage) return `windows-${codePage}`;
  if (normalized === "utf-16") {
    return bytes[0] === 0xfe && bytes[1] === 0xff ? "utf-16be" : "utf-16le";
  }
  return normalized;
}

async function readCharset(languageDirectory) {
  const definition = await fs.readFile(
    path.join(languageDirectory, "language.txt"),
    "utf8",
  );
  const charset = definition.match(/^\s*charset\s*=\s*([^,\r\n]+)/im)?.[1];
  if (!charset) {
    throw new Error(
      `Missing charset in ${path.join(languageDirectory, "language.txt")}`,
    );
  }
  return charset.trim();
}

export function decodeLuaString(value) {
  const escapes = { '"': '"', "\\": "\\", n: "\n", r: "\r", t: "\t" };
  return value.replace(/\\(["\\nrt])/g, (_, character) => escapes[character]);
}

export async function readGameTranslationFile(languageDirectory, filename) {
  const sourcePath = path.join(languageDirectory, filename);
  const bytes = await fs.readFile(sourcePath);
  const charset = await readCharset(languageDirectory);
  const content = new TextDecoder(normalizeCharset(charset, bytes)).decode(
    bytes,
  );
  return { content, sourcePath };
}

export async function gameTranslationFiles(
  translationDirectory,
  filenameForLanguage,
) {
  const entries = await fs.readdir(translationDirectory, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const gameLanguage = entry.name;
    const languageDirectory = path.join(translationDirectory, gameLanguage);
    const filename = filenameForLanguage(gameLanguage);
    try {
      await fs.access(path.join(languageDirectory, filename));
      files.push({ filename, gameLanguage, languageDirectory });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  return [...files].sort((left, right) =>
    left.gameLanguage.localeCompare(right.gameLanguage),
  );
}

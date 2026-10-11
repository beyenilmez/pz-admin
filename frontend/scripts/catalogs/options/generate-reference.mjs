#!/usr/bin/env node
/* oxlint-disable eslint/no-await-in-loop -- Game translations are read sequentially. */

// Extracts reference metadata from an installed game build. The chosen output
// is temporary input for maintaining the authoritative option definitions.
//
// Usage: pnpm generate:options:reference -- --build 41 \
//   --game-dir /path/to/ProjectZomboid --output /tmp/options-41.json

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { format } from "prettier";
import {
  decodeLuaString,
  findTranslationDirectory,
  readGameTranslationFile,
} from "../../translations/game-files.mjs";

const execFileAsync = promisify(execFile);
const helperPath = fileURLToPath(
  new URL("./ExtractServerOptions.java", import.meta.url),
);

function parseArgs(argv) {
  const args = {
    build: undefined,
    gameDirectory: undefined,
    output: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--build") args.build = argv[++index];
    else if (argument === "--game-dir") args.gameDirectory = argv[++index];
    else if (argument === "--output") args.output = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (args.build !== "41" && args.build !== "42") {
    throw new Error("Build is required and must be 41 or 42 (--build <build>)");
  }
  if (!args.gameDirectory) {
    throw new Error("Game directory is required (--game-dir <path>)");
  }
  if (!args.output) {
    throw new Error("Output file is required (--output <path>)");
  }
  return args;
}

async function isFile(file) {
  try {
    return (await fs.stat(file)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function findGameClassDirectory(gameDirectory) {
  const candidates = [
    gameDirectory,
    path.join(gameDirectory, "projectzomboid"),
    path.join(gameDirectory, "Contents", "Java"),
    path.join(gameDirectory, "Contents", "Resources", "Java"),
  ];

  for (const candidate of candidates) {
    const hasLooseClasses = await isFile(
      path.join(candidate, "zombie", "network", "ServerOptions.class"),
    );
    const hasGameJar = await isFile(path.join(candidate, "projectzomboid.jar"));
    if (hasLooseClasses || hasGameJar) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find Project Zomboid classes inside ${gameDirectory}`,
  );
}

function decode(value) {
  return Buffer.from(value, "base64").toString("utf8");
}

function optionalNumber(value) {
  return value === "-" ? undefined : Number(value);
}

function typedDefault(type, value) {
  if (type === "boolean") return value === "true";
  if (type === "integer" || type === "number") return Number(value);
  return value;
}

const dynamicDefaultOptions = new Set(["ResetID", "ServerPlayerID"]);

function extractedOptions(output) {
  return output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [encodedName, type, encodedDefault, minimum, maximum, maxLength] =
        line.split("\t");
      if (
        encodedName === undefined ||
        type === undefined ||
        encodedDefault === undefined ||
        minimum === undefined ||
        maximum === undefined ||
        maxLength === undefined
      ) {
        throw new Error(`Invalid metadata from Java extractor: ${line}`);
      }

      const option = {
        name: decode(encodedName),
        type,
      };
      if (dynamicDefaultOptions.has(option.name)) option.dynamicDefault = true;
      else option.defaultValue = typedDefault(type, decode(encodedDefault));
      const minimumValue = optionalNumber(minimum);
      const maximumValue = optionalNumber(maximum);
      const maximumLength = optionalNumber(maxLength);
      if (minimumValue !== undefined) option.minimum = minimumValue;
      if (maximumValue !== undefined) option.maximum = maximumValue;
      if (maximumLength !== undefined && maximumLength >= 0) {
        option.maximumLength = maximumLength;
      }
      return option;
    });
}

function legacyDescriptions(content) {
  return Object.fromEntries(
    content.split(/\r?\n/).flatMap((line) => {
      const match = line.match(
        /^\s*UI_ServerOption_(\S+)_tooltip\s*=\s*"(.*)"\s*,?\s*(?:--.*)?$/,
      );
      return match ? [[match[1], decodeLuaString(match[2])]] : [];
    }),
  );
}

async function englishDescriptions(gameDirectory, build) {
  const translations = await findTranslationDirectory(gameDirectory);
  const englishDirectory = path.join(translations, "EN");

  if (build === "41") {
    const { content } = await readGameTranslationFile(
      englishDirectory,
      "UI_EN.txt",
    );
    return legacyDescriptions(content);
  }

  const translationsJson = JSON.parse(
    await fs.readFile(path.join(englishDirectory, "UI.json"), "utf8"),
  );
  const prefix = "UI_ServerOption_";
  const suffix = "_tooltip";
  return Object.fromEntries(
    Object.entries(translationsJson).flatMap(([key, value]) =>
      key.startsWith(prefix) &&
      key.endsWith(suffix) &&
      typeof value === "string"
        ? [[key.slice(prefix.length, -suffix.length), value]]
        : [],
    ),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gameDirectory = path.resolve(args.gameDirectory);
  const classDirectory = await findGameClassDirectory(gameDirectory);
  const classPath = [classDirectory, path.join(classDirectory, "*")].join(
    path.delimiter,
  );
  const [{ stdout }, descriptions] = await Promise.all([
    execFileAsync("java", ["--class-path", classPath, helperPath], {
      maxBuffer: 1024 * 1024,
    }),
    englishDescriptions(gameDirectory, args.build),
  ]);

  const options = extractedOptions(stdout).map((option) => {
    const description = descriptions[option.name];
    if (description) option.description = description;
    return option;
  });
  const outputPath = path.resolve(args.output);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    await format(JSON.stringify({ build: args.build, options }), {
      parser: "json",
    }),
  );
  console.log(`Wrote ${options.length} option references to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

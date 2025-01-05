import fs from "fs";
import path from "path";
import { promisify } from "util";
import iconv from "iconv-lite";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Function to parse the translation text file
async function parseTranslationFile(sourcePath, targetPath, encoding = "UTF-8") {
  try {
    const fileBuffer = await readFile(sourcePath);
    const fileContent = iconv.decode(fileBuffer, encoding);

    const regex = /ItemName_([\w.]+\.[\w.]+)\s*=\s*"(.*)"/g;
    const translations = {};

    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const key = match[1]; // e.g., "Base.223Box"
      const value = match[2]; // e.g., ".223 Kalibre Mermi Kutusu"
      translations[key] = value;
    }

    const jsonContent = JSON.stringify(translations, null, 2);
    await writeFile(targetPath, jsonContent, "utf-8");
    console.log(`Successfully wrote translations to ${targetPath}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function main(locale, encoding) {
  if (!locale) {
    console.error("Please provide a locale parameter.");
    process.exit(1);
  }

  const sourcePath = path.resolve(`./game-translations/${locale}.txt`);
  const targetPath = path.resolve(`./public/locales/${locale}/items.json`);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  await parseTranslationFile(sourcePath, targetPath, encoding);
}

const locale = process.argv[2];
const encoding = process.argv[3] || "UTF-8";
main(locale, encoding);

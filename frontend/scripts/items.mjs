// File: scripts/scrapeItems.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

puppeteer.use(StealthPlugin());

// Paths
const outputJsonPath = "./src/assets/items.json";
const imagesPath = "./public/items";
const baseUrl = "https://pzwiki.net/w/index.php?oldid=509463"; // Build 41.78.16
//const baseUrl = "https://pzwiki.net/wiki/PZwiki:Item_list";

// Helper to download images
async function downloadImage(url, dest) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    const buffer = await response.buffer();
    await fs.writeFile(dest, buffer);
    //console.log(`Image saved: ${dest}`);
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
  }
}

async function scrapeItems() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Navigating to ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.content();

  // Extract data
  const items = await page.evaluate(() => {
    const categories = [];
    const categoryHeaders = document.querySelectorAll("h2 .mw-headline");

    categoryHeaders.forEach((categoryHeader) => {
      const categoryName = categoryHeader.innerText.trim();
      const categoryTable = categoryHeader.closest("h2").nextElementSibling.querySelector("table.wikitable");

      if (!categoryTable) return; // Skip if no table

      const categoryItems = [];
      const rows = categoryTable.querySelectorAll("tbody tr");

      rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        const cells = row.querySelectorAll("td");
        if (cells.length < 3) return;

        // Extract all images in the first cell
        const imageElements = cells[0].querySelectorAll("img");
        const images = Array.from(imageElements).map((img) => img.src);

        const name = cells[1]?.innerText?.trim() || "";
        const itemId = cells[2]?.innerText?.trim() || "";

        if (name && itemId) {
          categoryItems.push({ name, itemId, images });
        }
      });

      if (categoryItems.length > 0) {
        categories.push({ name: categoryName, items: categoryItems });
      }
    });

    return categories;
  });

  await browser.close();

  if (!items || items.length === 0) {
    console.error("No items extracted. Check DOM traversal or selectors.");
    return;
  }

  // Download images and prepare JSON
  const processedItems = [];
  await fs.mkdir(imagesPath, { recursive: true });

  for (const category of items) {
    const categoryItems = [];
    for (const item of category.items) {
      const downloadedImages = [];
      for (const [index, imageUrl] of item.images.entries()) {
        const imageFileName = `${item.itemId}_${index}.png`;
        const imageFilePath = path.join(imagesPath, imageFileName);
        await downloadImage(imageUrl, imageFilePath);
        downloadedImages.push(`items/${imageFileName}`);
      }
      item.images = downloadedImages; // Replace URLs with local paths
      categoryItems.push(item);
    }
    processedItems.push({ name: category.name, items: categoryItems });
  }

  // Save JSON file
  await fs.mkdir(path.dirname(outputJsonPath), { recursive: true });
  await fs.writeFile(outputJsonPath, JSON.stringify(processedItems, null, 0), "utf-8");
  console.log(`JSON generated at: ${outputJsonPath}`);
}

scrapeItems().catch((err) => {
  console.error("Error during scraping:", err.message);
});

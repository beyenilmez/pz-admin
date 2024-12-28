import fs from "node:fs/promises";
import path from "node:path";

const VEHICLES_DIR = path.join(process.cwd(), "public", "vehicles");
const OUTPUT_FILE = path.join(process.cwd(), "src", "assets", "vehicles.json");
const BASE_IMAGE_PATH = "vehicles";

async function processDirectory(dirPath, type) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const item = { name: entry.name, type };

      if (type === "type") {
        // Skip adding thumbnails for types
        try {
          const idEntries = await fs.readdir(fullPath, { withFileTypes: true });
          const idDir = idEntries.find((f) => f.isDirectory());
          if (idDir) {
            item.id = idDir.name;
            const imageDirPath = path.join(fullPath, idDir.name);
            try {
              const imageFiles = await fs.readdir(imageDirPath);
              item.images = imageFiles
                .filter((file) => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file))
                .map((imageFile) => {
                  return path
                    .join(BASE_IMAGE_PATH, path.relative(VEHICLES_DIR, path.join(imageDirPath, imageFile)))
                    .replace(/\\/g, "/");
                });
            } catch (imageError) {
              console.error(`Error reading images in ${imageDirPath}:`, imageError);
              item.images = [];
            }
          } else {
            item.id = entry.name;
            try {
              const imageFiles = idEntries.filter((f) => f.isFile() && /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name));
              item.images = imageFiles.map((imageFile) => {
                return path
                  .join(BASE_IMAGE_PATH, path.relative(VEHICLES_DIR, path.join(fullPath, imageFile.name)))
                  .replace(/\\/g, "/");
              });
            } catch (imageError) {
              console.error(`Error reading images in ${fullPath}:`, imageError);
              item.images = [];
            }
          }
        } catch (idError) {
          console.error(`Error reading ID in ${fullPath}:`, idError);
          item.id = entry.name;
          item.images = [];
        }
      } else {
        item.children = await processDirectory(fullPath, getNextType(type));

        // Add thumbnails to categories and models
        if (type === "category" || type === "model") {
          item.thumbnails = await getThumbnails(item.children, 4);
        }

        // Merge if only one child (type)
        if (item.children && item.children.length === 1 && item.children[0].type === "type") {
          const child = item.children[0];
          delete item.children; // Remove children array
          item.id = child.id;
          item.images = child.images;
          item.type = child.type;
        }
      }
      items.push(item);
    }
  }
  return items;
}

async function getThumbnails(children, limit) {
  const thumbnails = [];
  const queues = children.map((child) => ({
    child,
    imagesQueue: [...(child.images || [])],
    childrenQueue: [...(child.children || [])],
  }));

  while (thumbnails.length < limit) {
    let added = false;

    for (const queue of queues) {
      if (queue.imagesQueue.length > 0) {
        thumbnails.push(queue.imagesQueue.shift());
        added = true;
        if (thumbnails.length === limit) break;
      } else if (queue.childrenQueue.length > 0) {
        const subChild = queue.childrenQueue.shift();
        if (subChild.images && subChild.images.length > 0) {
          queue.imagesQueue.push(subChild.images[0]);
        }
        if (subChild.children && subChild.children.length > 0) {
          queue.childrenQueue.push(...subChild.children);
        }
      }
    }

    if (!added) break; // Exit if no more images or children are available
  }

  return thumbnails;
}

function getNextType(currentType) {
  switch (currentType) {
    case "category":
      return "model";
    case "model":
      return "type";
    default:
      return null;
  }
}

async function main() {
  try {
    const vehiclesData = await processDirectory(VEHICLES_DIR, "category");
    const jsonData = JSON.stringify(vehiclesData, null, 2);
    await fs.writeFile(OUTPUT_FILE, jsonData, "utf-8");
    console.log(`JSON data written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error processing vehicles data:", error);
  }
}

main();

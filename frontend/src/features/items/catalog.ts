import {
  loadItemTranslations,
  translatedItemCategoryName,
  translatedItemName,
} from "./lib/translations";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import { publicAssetUrl } from "@/shared/lib/publicAssetUrl";
import type {
  ItemCatalog,
  ItemCatalogCategory,
  ItemCatalogData,
  ItemCatalogEntry,
} from "./types";

const catalogLoaders = {
  "41": () => import("@/data/items/41.json"),
  "42": () => import("@/data/items/42.json"),
} satisfies Record<GameBuild, () => Promise<{ default: ItemCatalogData }>>;

const catalogRequests = new Map<string, Promise<ItemCatalog>>();

function prepareCatalog(
  data: ItemCatalogData,
  build: GameBuild,
  language: string,
): ItemCatalog {
  const categories: ItemCatalogCategory[] = [];
  const items: ItemCatalogEntry[] = [];
  const itemsById = new Map<string, ItemCatalogEntry>();
  const searchIndex = new Map<string, string>();
  const collator = new Intl.Collator(language, {
    numeric: true,
    sensitivity: "base",
  });

  for (const rawCategory of data.categories) {
    const categoryName =
      translatedItemCategoryName(build, language, rawCategory.id) ??
      rawCategory.name;
    const category: ItemCatalogCategory = {
      id: rawCategory.id,
      itemCount: rawCategory.items.length,
      name: categoryName,
    };

    for (const rawItem of rawCategory.items) {
      const item: ItemCatalogEntry = {
        build,
        category: categoryName,
        categoryId: rawCategory.id,
        defaultName: rawItem.name,
        id: rawItem.id,
        images: rawItem.images.map(publicAssetUrl),
        name: translatedItemName(build, language, rawItem.id) ?? rawItem.name,
      };
      items.push(item);
      itemsById.set(item.id, item);
      searchIndex.set(
        item.id,
        `${item.name} ${item.defaultName} ${item.id} ${categoryName} ${rawCategory.name}`.toLocaleLowerCase(
          language,
        ),
      );
    }

    if (category.itemCount > 0) categories.push(category);
  }

  items.sort((left, right) => collator.compare(left.name, right.name));
  categories.sort(
    (left, right) =>
      right.itemCount - left.itemCount ||
      collator.compare(left.name, right.name),
  );

  return {
    build,
    categories,
    items,
    itemsById,
    language,
    searchIndex,
  };
}

export function loadItemCatalog(
  build: GameBuild,
  language: string,
): Promise<ItemCatalog> {
  const languageTag = canonicalLanguage(language);
  const requestKey = `${build}:${languageTag}`;
  const existingRequest = catalogRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = Promise.all([
    catalogLoaders[build](),
    loadItemTranslations(build, languageTag),
  ]).then(([{ default: data }]) => {
    if (data.build !== build) {
      throw new Error(
        `Expected Build ${build} item data, received ${data.build}`,
      );
    }
    return prepareCatalog(data, build, languageTag);
  });
  catalogRequests.set(requestKey, request);
  void request.catch(() => {
    if (catalogRequests.get(requestKey) === request) {
      catalogRequests.delete(requestKey);
    }
  });
  return request;
}

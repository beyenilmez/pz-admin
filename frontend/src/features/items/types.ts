import type { GameBuild } from "@/features/game/types";

export interface ItemCatalogData {
  build: string;
  categories: RawItemCatalogCategory[];
}

export interface RawItemCatalogCategory {
  id: string;
  items: RawItemCatalogEntry[];
  name: string;
}

export interface RawItemCatalogEntry {
  id: string;
  images: string[];
  name: string;
}

export interface ItemCatalogEntry {
  build: GameBuild;
  category: string;
  categoryId: string;
  defaultName: string;
  id: string;
  images: string[];
  name: string;
}

export interface ItemCatalogCategory {
  id: string;
  itemCount: number;
  name: string;
}

export interface ItemCatalog {
  build: GameBuild;
  categories: ItemCatalogCategory[];
  items: ItemCatalogEntry[];
  itemsById: ReadonlyMap<string, ItemCatalogEntry>;
  language: string;
  searchIndex: ReadonlyMap<string, string>;
}

export type ItemSelection = ReadonlyMap<string, number>;

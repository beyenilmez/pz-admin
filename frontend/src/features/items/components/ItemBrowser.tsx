import { useDeferredValue, useMemo, useState } from "react";
import { SelectionWorkspace } from "@/shared/layout/SelectionWorkspace";
import { ItemCatalogPane } from "./ItemCatalogPane";
import { SelectedItemsPane } from "./SelectedItemsPane";
import type { ItemCatalog } from "@/features/items/types";
import type { ItemSelectionController } from "@/features/items/hooks/useItemSelection";

interface ItemBrowserProps {
  catalog: ItemCatalog | null;
  loading?: boolean;
  selection: ItemSelectionController;
}

export function ItemBrowser({
  catalog,
  loading = false,
  selection,
}: ItemBrowserProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const visibleItems = useMemo(() => {
    if (!catalog) return [];
    const query = deferredSearch.trim().toLocaleLowerCase(catalog.language);

    return catalog.items.filter(
      (item) =>
        !query ||
        item.category.toLocaleLowerCase(catalog.language).includes(query) ||
        catalog.searchIndex.get(item.id)?.includes(query),
    );
  }, [catalog, deferredSearch]);

  return (
    <SelectionWorkspace layout="items">
      <ItemCatalogPane
        categories={catalog?.categories ?? []}
        loading={loading}
        onItemAdd={selection.add}
        onSearchChange={setSearch}
        search={search}
        selectedQuantities={selection.selection}
        visibleItems={visibleItems}
      />
      <SelectedItemsPane catalog={catalog} selection={selection} />
    </SelectionWorkspace>
  );
}

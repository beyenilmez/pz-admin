import { useDeferredValue, useMemo, useRef, useState } from "react";
import type { TreeNodeData } from "@mantine/core";
import { queryVehicles, type VehicleSortDirection } from "../lib/query";
import {
  type VehicleRangeFilterStat,
  type VehicleRangeFilters,
  vehicleNumericStats,
  vehicleSortFields,
} from "../lib/stats";
import type { VehicleCatalog } from "../types";
import type { VehicleNumericStat, VehicleStatRange } from "../types";
import { vehicleCategoryValue, vehicleModelValue } from "../lib/hierarchy";

export type VehicleSortField = (typeof vehicleSortFields)[number];

export interface VehicleFilterController {
  canClear: boolean;
  changeHierarchy: (value: string | null) => void;
  changeLightbar: (value: boolean | null) => void;
  changeRange: (stat: VehicleRangeFilterStat, value: [number, number]) => void;
  clear: () => void;
  hierarchy: TreeNodeData[];
  lightbarAvailable: boolean;
  lightbarFilter: boolean | null;
  rangeFilters: VehicleRangeFilters;
  ranges: Partial<Record<VehicleNumericStat, VehicleStatRange>>;
  selectedHierarchy: string | null;
}

function isSortField(value: string): value is VehicleSortField {
  return vehicleSortFields.some((field) => field === value);
}

function prepareHierarchy(catalog: VehicleCatalog | null): TreeNodeData[] {
  if (!catalog) return [];

  return catalog.hierarchy.map((category) => ({
    children: category.models.map((model) => ({
      label: model.name,
      value: vehicleModelValue(category.id, model.id),
    })),
    label: category.name,
    value: vehicleCategoryValue(category.id),
  }));
}

export function useVehicleExplorer(
  catalog: VehicleCatalog | null,
  language: string,
) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rangeFilters, setRangeFilters] = useState<VehicleRangeFilters>({});
  const [lightbarFilter, setLightbarFilter] = useState<boolean | null>(null);
  const [selectedHierarchy, setSelectedHierarchy] = useState<string | null>(
    null,
  );
  const [sortField, setSortField] = useState<VehicleSortField>("name");
  const [sortDirection, setSortDirection] =
    useState<VehicleSortDirection>("ascending");
  const query = useMemo(
    () => ({
      lightbarFilter,
      rangeFilters,
      search,
      selectedHierarchy,
      sortDirection,
      sortField,
    }),
    [
      lightbarFilter,
      rangeFilters,
      search,
      selectedHierarchy,
      sortDirection,
      sortField,
    ],
  );
  const deferredQuery = useDeferredValue(query);
  const selectedVehicleIds = useMemo(() => {
    if (!deferredQuery.selectedHierarchy) return new Set<string>();
    return new Set(
      catalog?.vehicleIdsByHierarchyNode.get(deferredQuery.selectedHierarchy) ??
        [],
    );
  }, [catalog, deferredQuery.selectedHierarchy]);
  const vehicles = useMemo(
    () =>
      catalog
        ? queryVehicles(
            catalog,
            {
              lightbar: deferredQuery.lightbarFilter,
              rangeFilters: vehicleNumericStats.flatMap((stat) => {
                const range = deferredQuery.rangeFilters[stat];
                return range
                  ? [{ maximum: range[1], minimum: range[0], stat }]
                  : [];
              }),
              search: deferredQuery.search,
              selectedVehicleIds,
              sortDirection: deferredQuery.sortDirection,
              sortField: deferredQuery.sortField,
            },
            language,
          )
        : [],
    [catalog, deferredQuery, language, selectedVehicleIds],
  );

  function handleSortChange(value: string | null) {
    if (!value || !isSortField(value)) return;
    setSortField(value);
    setSortDirection(value === "name" ? "ascending" : "descending");
  }

  function clearFilters() {
    if (searchInputRef.current) searchInputRef.current.value = "";
    setSearch("");
    setSelectedHierarchy(null);
    setRangeFilters({});
    setLightbarFilter(null);
  }

  function handleRangeChange(
    stat: VehicleRangeFilterStat,
    value: [number, number],
  ) {
    const fullRange = catalog?.statRanges[stat];
    setRangeFilters((current) => {
      const next = { ...current };
      if (
        fullRange &&
        value[0] === fullRange.minimum &&
        value[1] === fullRange.maximum
      ) {
        delete next[stat];
      } else {
        next[stat] = value;
      }
      return next;
    });
  }

  const filters: VehicleFilterController = {
    canClear:
      search.length > 0 ||
      selectedHierarchy !== null ||
      lightbarFilter !== null ||
      Object.keys(rangeFilters).length > 0,
    changeHierarchy: setSelectedHierarchy,
    changeLightbar: setLightbarFilter,
    changeRange: handleRangeChange,
    clear: clearFilters,
    hierarchy: useMemo(() => prepareHierarchy(catalog), [catalog]),
    lightbarAvailable: catalog?.lightbarAvailable ?? false,
    lightbarFilter,
    rangeFilters,
    ranges: catalog?.statRanges ?? {},
    selectedHierarchy,
  };

  return {
    changeSort: handleSortChange,
    filters,
    search,
    searchInputRef,
    setSearch,
    setSortDirection,
    sortDirection,
    sortField,
    // A changed deferred query indicates that filtering is still catching up.
    updating: query !== deferredQuery,
    vehicles,
  };
}

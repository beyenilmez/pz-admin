import type {
  VehicleCatalog,
  VehicleCatalogEntry,
  VehicleNumericStat,
} from "../types";

export type VehicleSortDirection = "ascending" | "descending";
export type VehicleSortField = "category" | "name" | VehicleNumericStat;

export interface VehicleRangeFilter {
  maximum: number;
  minimum: number;
  stat: VehicleNumericStat;
}

export interface VehicleQuery {
  lightbar: boolean | null;
  rangeFilters: readonly VehicleRangeFilter[];
  search: string;
  selectedVehicleIds: ReadonlySet<string>;
  sortDirection: VehicleSortDirection;
  sortField: VehicleSortField;
}

function compareNumbers(
  first: number | undefined,
  second: number | undefined,
  direction: VehicleSortDirection,
): number {
  if (first === undefined) return second === undefined ? 0 : 1;
  if (second === undefined) return -1;
  return direction === "ascending" ? first - second : second - first;
}

export function queryVehicles(
  catalog: VehicleCatalog,
  query: VehicleQuery,
  language: string,
): VehicleCatalogEntry[] {
  const search = query.search.trim().toLowerCase();
  const filtered: VehicleCatalogEntry[] = [];

  for (const vehicle of catalog.vehicles) {
    if (
      query.selectedVehicleIds.size > 0 &&
      !query.selectedVehicleIds.has(vehicle.id)
    ) {
      continue;
    }
    if (search && !catalog.searchIndex.get(vehicle.id)?.includes(search)) {
      continue;
    }
    // The catalog records only present lightbars, so an omitted flag means false.
    const hasLightbar = vehicle.stats.lightbar === true;
    if (query.lightbar !== null && hasLightbar !== query.lightbar) {
      continue;
    }
    let matchesRanges = true;
    for (const range of query.rangeFilters) {
      const value = vehicle.stats[range.stat];
      if (
        value === undefined ||
        value < range.minimum ||
        value > range.maximum
      ) {
        matchesRanges = false;
        break;
      }
    }
    if (!matchesRanges) continue;
    filtered.push(vehicle);
  }

  filtered.sort((first, second) => {
    let comparison: number;
    if (query.sortField === "name") {
      comparison = first.name.localeCompare(second.name, language);
    } else if (query.sortField === "category") {
      comparison = first.category.localeCompare(second.category, language);
    } else {
      comparison = compareNumbers(
        first.stats[query.sortField],
        second.stats[query.sortField],
        query.sortDirection,
      );
      if (comparison !== 0) return comparison;
      return first.name.localeCompare(second.name, language);
    }

    if (comparison === 0) {
      comparison = (first.variant ?? "").localeCompare(
        second.variant ?? "",
        language,
      );
    }
    return query.sortDirection === "ascending" ? comparison : -comparison;
  });

  return filtered;
}

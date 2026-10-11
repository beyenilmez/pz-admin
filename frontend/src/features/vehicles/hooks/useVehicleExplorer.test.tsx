import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vehicleCategoryValue, vehicleModelValue } from "../lib/hierarchy";
import type { VehicleCatalog, VehicleCatalogEntry } from "../types";
import { useVehicleExplorer } from "./useVehicleExplorer";

const vehicles = [
  {
    build: "42",
    category: "Emergency",
    id: "rescue-light",
    image: null,
    name: "Alpha Rescue",
    stats: { lightbar: false, weight: 1_150 },
    variant: null,
  },
  {
    build: "42",
    category: "Emergency",
    id: "rescue-heavy",
    image: null,
    name: "Bravo Rescue",
    stats: { lightbar: true, weight: 1_200 },
    variant: null,
  },
  {
    build: "42",
    category: "Utility",
    id: "service",
    image: null,
    name: "Charlie Service",
    stats: { lightbar: true, weight: 900 },
    variant: null,
  },
] satisfies VehicleCatalogEntry[];

const emergencyCategory = vehicleCategoryValue("emergency");
const emergencyModel = vehicleModelValue("emergency", "responder");

const catalog = {
  build: "42",
  hierarchy: [
    {
      id: "emergency",
      models: [
        {
          defaultVariantId: "base",
          id: "responder",
          name: "Responder",
          variants: [{ id: "base", name: "Base" }],
        },
      ],
      name: "Emergency",
    },
  ],
  language: "en",
  lightbarAvailable: true,
  searchIndex: new Map(
    vehicles.map((vehicle) => [
      vehicle.id,
      `${vehicle.name} ${vehicle.category}`.toLowerCase(),
    ]),
  ),
  statRanges: { weight: { maximum: 1_200, minimum: 900 } },
  variantsByVehicleId: new Map(),
  vehicleIdsByHierarchyNode: new Map([
    [emergencyCategory, ["rescue-light", "rescue-heavy"]],
    [emergencyModel, ["rescue-light", "rescue-heavy"]],
  ]),
  vehicles,
  vehiclesById: new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
} satisfies VehicleCatalog;

function vehicleIds(entries: readonly VehicleCatalogEntry[]) {
  return entries.map((entry) => entry.id);
}

describe("useVehicleExplorer", () => {
  it("exposes useful catalog metadata and defaults", () => {
    const { result } = renderHook(() => useVehicleExplorer(catalog, "en"));

    expect(result.current).toMatchObject({
      sortDirection: "ascending",
      sortField: "name",
    });
    expect(result.current.filters).toMatchObject({
      canClear: false,
      hierarchy: [
        {
          children: [{ label: "Responder", value: emergencyModel }],
          label: "Emergency",
          value: emergencyCategory,
        },
      ],
      lightbarAvailable: true,
      ranges: { weight: { maximum: 1_200, minimum: 900 } },
    });
  });

  it("combines the public filter controls", async () => {
    const { result } = renderHook(() => useVehicleExplorer(catalog, "en"));

    act(() => {
      result.current.filters.changeHierarchy(emergencyModel);
      result.current.filters.changeLightbar(true);
      result.current.filters.changeRange("weight", [1_100, 1_200]);
      result.current.setSearch("RESCUE");
    });

    await waitFor(() => {
      expect(result.current.updating).toBe(false);
      expect(vehicleIds(result.current.vehicles)).toEqual(["rescue-heavy"]);
    });
    expect(result.current.filters.canClear).toBe(true);
  });

  it("drops a full range and clears all filters", async () => {
    const { result } = renderHook(() => useVehicleExplorer(catalog, "en"));

    act(() => {
      result.current.filters.changeHierarchy(emergencyCategory);
      result.current.filters.changeLightbar(false);
      result.current.setSearch("rescue");
      result.current.filters.changeRange("weight", [1_000, 1_200]);
    });
    expect(result.current.filters.canClear).toBe(true);

    act(() => {
      result.current.filters.changeRange("weight", [900, 1_200]);
    });
    expect(result.current.filters.rangeFilters).toEqual({});

    act(() => result.current.filters.clear());
    expect(result.current.filters).toMatchObject({
      canClear: false,
      lightbarFilter: null,
      rangeFilters: {},
      selectedHierarchy: null,
    });
    await waitFor(() =>
      expect(vehicleIds(result.current.vehicles)).toEqual([
        "rescue-light",
        "rescue-heavy",
        "service",
      ]),
    );
  });

  it("chooses sensible directions when the sort field changes", () => {
    const { result } = renderHook(() => useVehicleExplorer(catalog, "en"));

    act(() => result.current.changeSort("weight"));
    expect(result.current).toMatchObject({
      sortDirection: "descending",
      sortField: "weight",
    });

    act(() => result.current.changeSort("name"));
    expect(result.current).toMatchObject({
      sortDirection: "ascending",
      sortField: "name",
    });
  });
});

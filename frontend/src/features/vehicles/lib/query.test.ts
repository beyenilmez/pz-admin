import { describe, expect, it } from "vitest";
import type { VehicleCatalog, VehicleCatalogEntry } from "../types";
import { queryVehicles, type VehicleQuery } from "./query";

const vehicles = [
  {
    build: "42",
    category: "Utility",
    id: "alpha-police",
    image: null,
    name: "Alpha",
    stats: { lightbar: true, seats: 4, weight: 1200 },
    variant: "Police",
  },
  {
    build: "42",
    category: "Commercial",
    id: "bravo",
    image: null,
    name: "Bravo",
    stats: { lightbar: false, seats: 2, weight: 1200 },
    variant: null,
  },
  {
    build: "42",
    category: "Commercial",
    id: "delta",
    image: null,
    name: "Delta",
    stats: { lightbar: false, seats: 5, weight: 1000 },
    variant: "Taxi",
  },
  {
    build: "42",
    category: "Utility",
    id: "alpha-base",
    image: null,
    name: "Alpha",
    stats: { seats: 4, weight: 1200 },
    variant: "Base Model",
  },
  {
    build: "42",
    category: "Emergency",
    id: "charlie",
    image: null,
    name: "Charlie",
    stats: { seats: 4 },
    variant: null,
  },
] satisfies VehicleCatalogEntry[];

const catalog = {
  build: "42",
  hierarchy: [],
  language: "en-US",
  lightbarAvailable: true,
  searchIndex: new Map(
    vehicles.map((vehicle) => [
      vehicle.id,
      `${vehicle.name} ${vehicle.category} ${vehicle.variant ?? ""} ${vehicle.id}`.toLowerCase(),
    ]),
  ),
  statRanges: {},
  variantsByVehicleId: new Map(),
  vehicleIdsByHierarchyNode: new Map(),
  vehiclesById: new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
  vehicles,
} satisfies VehicleCatalog;

const defaultQuery = {
  lightbar: null,
  rangeFilters: [],
  search: "",
  selectedVehicleIds: new Set<string>(),
  sortDirection: "ascending",
  sortField: "name",
} satisfies VehicleQuery;

function queryIds(query: Partial<VehicleQuery> = {}) {
  return queryVehicles(catalog, { ...defaultQuery, ...query }, "en-US").map(
    (vehicle) => vehicle.id,
  );
}

describe("queryVehicles filtering", () => {
  it("intersects selected IDs with normalized search results", () => {
    expect(
      queryIds({
        search: "  ALPHA  ",
        selectedVehicleIds: new Set(["alpha-police", "bravo"]),
      }),
    ).toEqual(["alpha-police"]);
  });

  it.each([
    { expected: ["alpha-police"], lightbar: true },
    {
      expected: ["alpha-base", "bravo", "charlie", "delta"],
      lightbar: false,
    },
  ])(
    "filters for lightbar=$lightbar and treats an omitted flag as false",
    ({ expected, lightbar }) => {
      expect(queryIds({ lightbar })).toEqual(expected);
    },
  );

  it("includes range endpoints and excludes out-of-range or missing stats", () => {
    expect(
      queryIds({
        rangeFilters: [{ maximum: 1200, minimum: 1000, stat: "weight" }],
      }),
    ).toEqual(["alpha-base", "alpha-police", "bravo", "delta"]);

    expect(
      queryIds({
        rangeFilters: [{ maximum: 4, minimum: 4, stat: "seats" }],
      }),
    ).toEqual(["alpha-base", "alpha-police", "charlie"]);
  });
});

describe("queryVehicles sorting", () => {
  it("sorts names and uses variants to break ties", () => {
    expect(queryIds()).toEqual([
      "alpha-base",
      "alpha-police",
      "bravo",
      "charlie",
      "delta",
    ]);
  });

  it("sorts categories", () => {
    expect(queryIds({ sortField: "category" })).toEqual([
      "bravo",
      "delta",
      "charlie",
      "alpha-base",
      "alpha-police",
    ]);
  });

  it("sorts numeric values descending with missing values last", () => {
    expect(
      queryIds({ sortDirection: "descending", sortField: "weight" }),
    ).toEqual(["alpha-police", "alpha-base", "bravo", "delta", "charlie"]);
  });
});

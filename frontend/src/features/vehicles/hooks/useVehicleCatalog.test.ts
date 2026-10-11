import { act, renderHook } from "@/test/render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadVehicleCatalog } from "../catalog";
import type { VehicleCatalog } from "../types";
import { useVehicleCatalog } from "./useVehicleCatalog";

const { language } = vi.hoisted(() => ({
  language: { current: "en-us" },
}));

vi.mock("react-i18next", async (importOriginal) => {
  const reactI18next = await importOriginal<typeof import("react-i18next")>();
  return {
    ...reactI18next,
    useTranslation: () => ({ i18n: { language: language.current } }),
  };
});

vi.mock("../catalog", () => ({
  loadVehicleCatalog: vi.fn(),
}));

function catalog(build: "41" | "42", catalogLanguage: string): VehicleCatalog {
  return {
    build,
    hierarchy: [],
    language: catalogLanguage,
    lightbarAvailable: false,
    searchIndex: new Map(),
    statRanges: {},
    variantsByVehicleId: new Map(),
    vehicleIdsByHierarchyNode: new Map(),
    vehicles: [],
    vehiclesById: new Map(),
  };
}

interface Deferred<Value> {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
}

function deferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  language.current = "en-us";
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("useVehicleCatalog", () => {
  it("loads for the active build and ignores a stale request", async () => {
    const oldRequest = deferred<VehicleCatalog>();
    const buildRequest = deferred<VehicleCatalog>();
    vi.mocked(loadVehicleCatalog)
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(buildRequest.promise);
    const hook = renderHook(
      ({ build }: { build: "41" | "42" }) => useVehicleCatalog(build),
      { initialProps: { build: "41" } },
    );

    expect(loadVehicleCatalog).toHaveBeenCalledWith("41", "en-US");

    hook.rerender({ build: "42" });

    expect(loadVehicleCatalog).toHaveBeenCalledTimes(2);
    expect(loadVehicleCatalog).toHaveBeenLastCalledWith("42", "en-US");
    expect(hook.result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });

    await act(async () => {
      oldRequest.resolve(catalog("41", "en-US"));
      await oldRequest.promise;
    });

    expect(hook.result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });

    const buildCatalog = catalog("42", "en-US");
    await act(async () => {
      buildRequest.resolve(buildCatalog);
      await buildRequest.promise;
    });

    expect(hook.result.current).toMatchObject({
      catalog: buildCatalog,
      error: null,
      loading: false,
    });
  });
});

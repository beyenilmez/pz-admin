import { act, renderHook } from "@/test/render";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadItemCatalog } from "../catalog";
import type { ItemCatalog } from "../types";
import { useItemCatalog } from "./useItemCatalog";

vi.mock("../catalog", () => ({
  loadItemCatalog: vi.fn(),
}));

function catalog(build: "41" | "42", language: string): ItemCatalog {
  return {
    build,
    categories: [],
    items: [],
    itemsById: new Map(),
    language,
    searchIndex: new Map(),
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

afterEach(() => {
  vi.resetAllMocks();
});

describe("useItemCatalog", () => {
  it("loads the requested build and accepts the loader's canonical language", async () => {
    const request = deferred<ItemCatalog>();
    vi.mocked(loadItemCatalog).mockReturnValue(request.promise);

    const { result } = renderHook(() => useItemCatalog("42", "en-us"));

    expect(result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });
    expect(loadItemCatalog).toHaveBeenCalledOnce();
    expect(loadItemCatalog).toHaveBeenCalledWith("42", "en-us");

    const loaded = catalog("42", "en-US");
    await act(async () => {
      request.resolve(loaded);
      await request.promise;
    });

    expect(result.current).toMatchObject({
      catalog: loaded,
      error: null,
      loading: false,
    });
  });
});

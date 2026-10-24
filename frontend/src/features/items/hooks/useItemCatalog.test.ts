import { act, renderHook, waitFor } from "@/test/render";
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
  it("clears a failed request when switching languages", async () => {
    const nextRequest = deferred<ItemCatalog>();
    vi.mocked(loadItemCatalog)
      .mockRejectedValueOnce(new Error("catalog unavailable"))
      .mockReturnValueOnce(nextRequest.promise);
    const { result, rerender } = renderHook(
      ({ language }) => useItemCatalog("42", language),
      { initialProps: { language: "en-US" } },
    );

    await waitFor(() =>
      expect(result.current.error).toBe("catalog unavailable"),
    );
    rerender({ language: "tr-TR" });
    expect(result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });

    const loaded = catalog("42", "tr-TR");
    await act(async () => {
      nextRequest.resolve(loaded);
      await nextRequest.promise;
    });
    expect(result.current.catalog).toBe(loaded);
    expect(result.current.loading).toBe(false);
  });

  it("clears a settled catalog while reloading the same request", async () => {
    const loaded = catalog("42", "en-US");
    const retry = deferred<ItemCatalog>();
    vi.mocked(loadItemCatalog)
      .mockResolvedValueOnce(loaded)
      .mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useItemCatalog("42", "en-US"));
    await waitFor(() => expect(result.current.catalog).toBe(loaded));

    act(() => result.current.reload());
    expect(result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });
    expect(loadItemCatalog).toHaveBeenCalledTimes(2);

    await act(async () => {
      retry.resolve(loaded);
      await retry.promise;
    });
    expect(result.current.catalog).toBe(loaded);
    expect(result.current.loading).toBe(false);
  });

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

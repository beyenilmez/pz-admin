import { act, renderHook, waitFor } from "@/test/render";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSkillCatalog } from "../catalog";
import type { SkillCatalog } from "../types";
import { useSkillCatalog } from "./useSkillCatalog";

vi.mock("../catalog", () => ({
  loadSkillCatalog: vi.fn(),
}));

function catalog(build: "41" | "42", language: string): SkillCatalog {
  return {
    build,
    categories: [],
    language,
    progressions: new Map(),
    skills: [],
    skillsById: new Map(),
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

describe("useSkillCatalog", () => {
  it("exposes a load failure and reloads the same build-language key", async () => {
    const retryRequest = deferred<SkillCatalog>();
    vi.mocked(loadSkillCatalog)
      .mockRejectedValueOnce(new Error("skill catalog unavailable"))
      .mockReturnValueOnce(retryRequest.promise);

    const { result } = renderHook(() => useSkillCatalog("41", "tr-TR"));

    await waitFor(() =>
      expect(result.current).toMatchObject({
        catalog: null,
        error: "skill catalog unavailable",
        loading: false,
      }),
    );

    act(() => result.current.reload());

    expect(result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });
    expect(loadSkillCatalog).toHaveBeenCalledTimes(2);
    expect(loadSkillCatalog).toHaveBeenNthCalledWith(1, "41", "tr-TR");
    expect(loadSkillCatalog).toHaveBeenNthCalledWith(2, "41", "tr-TR");

    const loaded = catalog("41", "tr-TR");
    await act(async () => {
      retryRequest.resolve(loaded);
      await retryRequest.promise;
    });

    expect(result.current).toMatchObject({
      catalog: loaded,
      error: null,
      loading: false,
    });
  });
});

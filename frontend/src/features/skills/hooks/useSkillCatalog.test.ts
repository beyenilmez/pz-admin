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
  it("starts a fresh request when returning to a previous build", async () => {
    const original = catalog("41", "en-US");
    const otherBuild = deferred<SkillCatalog>();
    const returningBuild = deferred<SkillCatalog>();
    vi.mocked(loadSkillCatalog)
      .mockResolvedValueOnce(original)
      .mockReturnValueOnce(otherBuild.promise)
      .mockReturnValueOnce(returningBuild.promise);
    const { result, rerender } = renderHook(
      ({ build }: { build: "41" | "42" }) => useSkillCatalog(build, "en-US"),
      { initialProps: { build: "41" } },
    );
    await waitFor(() => expect(result.current.catalog).toBe(original));

    rerender({ build: "41" });
    expect(loadSkillCatalog).toHaveBeenCalledTimes(1);
    expect(result.current.catalog).toBe(original);

    rerender({ build: "42" });
    rerender({ build: "41" });
    expect(loadSkillCatalog).toHaveBeenCalledTimes(3);
    expect(result.current).toMatchObject({
      catalog: null,
      error: null,
      loading: true,
    });

    const latest = catalog("41", "en-US");
    await act(async () => {
      returningBuild.resolve(latest);
      await returningBuild.promise;
    });
    expect(result.current.catalog).toBe(latest);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      otherBuild.resolve(catalog("42", "en-US"));
      await otherBuild.promise;
    });
    expect(result.current.catalog).toBe(latest);
    expect(result.current.loading).toBe(false);
    expect(loadSkillCatalog).toHaveBeenCalledTimes(3);
  });

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

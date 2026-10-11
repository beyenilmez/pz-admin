import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpdateResult } from "@bindings/internal/options/models";
import { List, Update } from "@bindings/internal/options/service";
import type { OptionCategory } from "../catalog";
import { useOptionsEditor } from "./useOptionsEditor";

vi.mock("@bindings/internal/options/service", () => ({
  List: vi.fn(),
  Update: vi.fn(),
}));

const catalog = [
  {
    id: "general",
    sections: [
      {
        id: "server",
        options: [
          {
            name: "Count",
            type: "integer",
            required: true,
          },
          {
            name: "Enabled",
            type: "boolean",
          },
          {
            name: "Modes",
            type: "string",
            multiple: true,
          },
          {
            name: "Secret",
            type: "string",
            writeOnly: true,
          },
          {
            name: "Unsupported",
            type: "string",
          },
        ],
      },
    ],
  },
] satisfies OptionCategory[];

const serverValues = {
  Count: "3",
  Enabled: "true",
  Modes: "alpha,beta",
};

type EditorSaveOutcome = Awaited<
  ReturnType<ReturnType<typeof useOptionsEditor>["save"]>
>;

async function renderLoadedEditor() {
  vi.mocked(List).mockResolvedValue(serverValues);
  const hook = renderHook(() => useOptionsEditor(catalog, true));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useOptionsEditor", () => {
  it("loads only when activated and retains write-only supported options", async () => {
    vi.mocked(List).mockResolvedValue(serverValues);
    const { rerender, result } = renderHook(
      ({ active }) => useOptionsEditor(catalog, active),
      { initialProps: { active: false } },
    );

    expect(List).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual([]);

    rerender({ active: true });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(List).toHaveBeenCalledOnce();
    expect(result.current.definitions.map(({ name }) => name)).toEqual([
      "Count",
      "Enabled",
      "Modes",
      "Secret",
    ]);
    expect(result.current.form.getValues()).toEqual({
      Count: 3,
      Enabled: true,
      Modes: ["alpha", "beta"],
      Secret: undefined,
    });
  });

  it("exposes an initial load failure and recovers through a manual retry", async () => {
    const loadFailure = new Error("options unavailable");
    vi.mocked(List)
      .mockRejectedValueOnce(loadFailure)
      .mockResolvedValueOnce(serverValues);
    const { result } = renderHook(() => useOptionsEditor(catalog, true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe(loadFailure);
    await act(async () => {
      await result.current.load();
    });

    expect(List).toHaveBeenCalledTimes(2);
    expect(result.current.loadError).toBeNull();
    expect(result.current.form.getValues().Count).toBe(3);
  });

  it("does not overwrite dirty edits when reloading", async () => {
    const { result } = await renderLoadedEditor();

    act(() => result.current.form.setFieldValue("Count", 4));
    vi.mocked(List).mockResolvedValueOnce({ ...serverValues, Count: "5" });

    await act(async () => {
      await result.current.load();
    });

    expect(List).toHaveBeenCalledTimes(2);
    expect(result.current.form.getValues().Count).toBe(4);
    expect(result.current.form.getInitialValues().Count).toBe(3);
    expect(result.current.form.isDirty()).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("does not update unchanged or invalid values", async () => {
    const { result } = await renderLoadedEditor();

    act(() => result.current.form.setFieldValue("Modes", ["beta", "alpha"]));
    await act(async () => {
      expect(await result.current.save()).toBeNull();
    });

    act(() => result.current.form.setFieldValue("Count", undefined));
    await act(async () => {
      expect(await result.current.save()).toBeNull();
    });

    expect(Update).not.toHaveBeenCalled();
  });

  it("serializes and sends only changed values", async () => {
    const { result } = await renderLoadedEditor();
    vi.mocked(Update).mockResolvedValue(
      new UpdateResult({ updated: ["Count", "Secret"] }),
    );
    vi.mocked(List).mockResolvedValueOnce({ ...serverValues, Count: "4" });

    act(() => {
      result.current.form.setFieldValue("Count", 4);
      result.current.form.setFieldValue("Modes", ["beta", "gamma"]);
      result.current.form.setFieldValue("Secret", "new secret");
    });
    await act(async () => {
      await result.current.save();
    });

    expect(Update).toHaveBeenCalledOnce();
    expect(Update).toHaveBeenCalledWith({
      Count: "4",
      Modes: "beta,gamma",
      Secret: "new secret",
    });
  });

  it("adopts refreshed values while retaining failed edits and errors", async () => {
    const { result } = await renderLoadedEditor();
    vi.mocked(Update).mockResolvedValue(
      new UpdateResult({
        updated: ["Count"],
        failed: { Secret: "Secret was rejected" },
      }),
    );
    vi.mocked(List).mockResolvedValueOnce({ ...serverValues, Count: "4" });

    act(() => {
      result.current.form.setFieldValue("Count", 4);
      result.current.form.setFieldValue("Secret", "rejected secret");
    });
    let outcome!: EditorSaveOutcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({
      refreshed: true,
      result: new UpdateResult({
        updated: ["Count"],
        failed: { Secret: "Secret was rejected" },
      }),
    });
    expect(result.current.form.getValues()).toMatchObject({
      Count: 4,
      Secret: "rejected secret",
    });
    expect(result.current.form.errors).toEqual({
      Secret: "Secret was rejected",
    });
    expect(result.current.form.isDirty("Count")).toBe(false);
    expect(result.current.form.isDirty("Secret")).toBe(true);
  });

  it("preserves dirty edits and clears saving when post-save refresh fails", async () => {
    const { result } = await renderLoadedEditor();
    vi.mocked(Update).mockResolvedValue(
      new UpdateResult({ updated: ["Count"] }),
    );
    vi.mocked(List).mockRejectedValueOnce(new Error("refresh failed"));

    act(() => result.current.form.setFieldValue("Count", 4));
    let outcome!: EditorSaveOutcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({
      refreshed: false,
      result: new UpdateResult({ updated: ["Count"] }),
    });
    expect(result.current.form.getValues().Count).toBe(4);
    expect(result.current.form.isDirty()).toBe(true);
    expect(result.current.saving).toBe(false);
  });
});

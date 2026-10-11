import { act, renderHook } from "@/test/render";
import { describe, expect, it } from "vitest";
import { useItemSelection } from "./useItemSelection";

function selectionEntries(selection: ReadonlyMap<string, number>) {
  return [...selection];
}

describe("useItemSelection", () => {
  it("trims IDs and increments quantities using the default or given amount", () => {
    const { result } = renderHook(() => useItemSelection());

    act(() => {
      result.current.add(" Base.Axe ");
      result.current.add("Base.Axe", 2);
      result.current.add("Base.Hammer", 4);
    });

    expect(selectionEntries(result.current.selection)).toEqual([
      ["Base.Axe", 3],
      ["Base.Hammer", 4],
    ]);
  });

  it("ignores invalid additions", () => {
    const { result } = renderHook(() => useItemSelection());

    act(() => {
      result.current.add("Base.Axe", 0);
      result.current.add("   ");
    });

    expect(selectionEntries(result.current.selection)).toEqual([]);
  });

  it("updates, removes, and clears the selection", () => {
    const { result } = renderHook(() => useItemSelection());
    act(() => {
      result.current.add("Base.Axe", 2);
      result.current.add("Base.Hammer");
      result.current.setQuantity("Base.Axe", 4);
      result.current.remove("Base.Hammer");
    });

    expect(selectionEntries(result.current.selection)).toEqual([
      ["Base.Axe", 4],
    ]);

    act(() => result.current.clear());
    expect(selectionEntries(result.current.selection)).toEqual([]);
  });
});

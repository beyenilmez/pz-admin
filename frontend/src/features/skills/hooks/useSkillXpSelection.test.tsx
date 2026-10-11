import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useSkillXpSelection,
  type SkillXpSelection,
} from "./useSkillXpSelection";

type ObservableChoice =
  | { amount: number | null; mode: "custom" }
  | { levels: number[]; mode: "levels" };

function observableSelection(selection: SkillXpSelection) {
  return Array.from(selection, ([skillId, choice]) => [
    skillId,
    choice.mode === "custom"
      ? { amount: choice.amount, mode: choice.mode }
      : {
          levels: [...choice.levels].sort((left, right) => left - right),
          mode: choice.mode,
        },
  ]) satisfies [string, ObservableChoice][];
}

describe("useSkillXpSelection", () => {
  it("toggles skills and their selected levels", () => {
    const { result } = renderHook(() => useSkillXpSelection());
    expect(observableSelection(result.current.selection)).toEqual([]);

    act(() => result.current.toggleSkill("Aiming"));
    expect(observableSelection(result.current.selection)).toEqual([
      ["Aiming", { levels: [], mode: "levels" }],
    ]);

    act(() => {
      result.current.toggleLevel("Aiming", 2);
      result.current.toggleLevel("Aiming", 3);
      result.current.toggleLevel("Aiming", 2);
    });

    expect(observableSelection(result.current.selection)).toEqual([
      ["Aiming", { levels: [3], mode: "levels" }],
    ]);

    act(() => result.current.toggleSkill("Aiming"));
    expect(observableSelection(result.current.selection)).toEqual([]);
  });

  it("switches between level and custom XP choices", () => {
    const { result } = renderHook(() => useSkillXpSelection());
    act(() => {
      result.current.toggleSkill("Aiming");
      result.current.toggleLevel("Aiming", 4);
      result.current.setMode("Aiming", "custom");
    });
    expect(observableSelection(result.current.selection)).toEqual([
      ["Aiming", { amount: null, mode: "custom" }],
    ]);

    act(() => result.current.setCustomAmount("Aiming", 250));
    expect(observableSelection(result.current.selection)).toEqual([
      ["Aiming", { amount: 250, mode: "custom" }],
    ]);
  });

  it("replaces, removes, and clears selections", () => {
    const { result } = renderHook(() => useSkillXpSelection());
    const replacement: SkillXpSelection = new Map([
      ["Aiming", { levels: new Set([2, 1]), mode: "levels" }],
      ["Fitness", { amount: 100, mode: "custom" }],
    ]);

    act(() => result.current.replace(replacement));
    expect(observableSelection(result.current.selection)).toEqual([
      ["Aiming", { levels: [1, 2], mode: "levels" }],
      ["Fitness", { amount: 100, mode: "custom" }],
    ]);

    act(() => result.current.remove("Aiming"));
    expect(observableSelection(result.current.selection)).toEqual([
      ["Fitness", { amount: 100, mode: "custom" }],
    ]);

    act(() => result.current.clear());
    expect(observableSelection(result.current.selection)).toEqual([]);
  });
});

import { useCallback, useState } from "react";

export type SkillXpChoice =
  | { amount: number | null; mode: "custom" }
  | { levels: ReadonlySet<number>; mode: "levels" };

export type SkillXpSelection = ReadonlyMap<string, SkillXpChoice>;

export interface SkillXpSelectionController {
  clear: () => void;
  remove: (skillId: string) => void;
  replace: (selection: SkillXpSelection) => void;
  selection: SkillXpSelection;
  setCustomAmount: (skillId: string, amount: number | null) => void;
  setMode: (skillId: string, mode: SkillXpChoice["mode"]) => void;
  toggleLevel: (skillId: string, level: number) => void;
  toggleSkill: (skillId: string) => void;
}

export function useSkillXpSelection(): SkillXpSelectionController {
  const [selection, setSelection] = useState<SkillXpSelection>(() => new Map());

  const toggleSkill = useCallback((skillId: string) => {
    setSelection((current) => {
      const next = new Map(current);
      if (current.has(skillId)) next.delete(skillId);
      else next.set(skillId, { levels: new Set(), mode: "levels" });
      return next;
    });
  }, []);

  const toggleLevel = useCallback((skillId: string, level: number) => {
    if (!Number.isInteger(level) || level < 1) return;

    setSelection((current) => {
      const choice = current.get(skillId);
      if (!choice || choice.mode !== "levels") return current;

      const levels = new Set(choice.levels);
      if (levels.has(level)) levels.delete(level);
      else levels.add(level);

      const next = new Map(current);
      next.set(skillId, { levels, mode: "levels" });
      return next;
    });
  }, []);

  const setMode = useCallback(
    (skillId: string, mode: SkillXpChoice["mode"]) => {
      setSelection((current) => {
        const choice = current.get(skillId);
        if (!choice || choice.mode === mode) return current;

        const next = new Map(current);
        next.set(
          skillId,
          mode === "custom"
            ? { amount: null, mode }
            : { levels: new Set(), mode },
        );
        return next;
      });
    },
    [],
  );

  const setCustomAmount = useCallback(
    (skillId: string, amount: number | null) => {
      setSelection((current) => {
        const choice = current.get(skillId);
        if (!choice || choice.mode !== "custom" || choice.amount === amount) {
          return current;
        }

        const next = new Map(current);
        next.set(skillId, { amount, mode: "custom" });
        return next;
      });
    },
    [],
  );

  const remove = useCallback((skillId: string) => {
    setSelection((current) => {
      if (!current.has(skillId)) return current;
      const next = new Map(current);
      next.delete(skillId);
      return next;
    });
  }, []);

  const replace = useCallback(
    (nextSelection: SkillXpSelection) => setSelection(nextSelection),
    [],
  );
  const clear = useCallback(() => setSelection(new Map()), []);

  return {
    clear,
    remove,
    replace,
    selection,
    setCustomAmount,
    setMode,
    toggleLevel,
    toggleSkill,
  };
}

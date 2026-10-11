import { useCallback, useState } from "react";
import type { ItemSelection } from "../types";

export interface ItemSelectionController {
  add: (itemId: string, amount?: number) => void;
  clear: () => void;
  remove: (itemId: string) => void;
  replace: (selection: ItemSelection) => void;
  selection: ItemSelection;
  setQuantity: (itemId: string, quantity: number) => void;
}

export function useItemSelection(): ItemSelectionController {
  const [selection, setSelection] = useState<ItemSelection>(() => new Map());

  const add = useCallback((itemId: string, amount = 1) => {
    const id = itemId.trim();
    if (!id || !Number.isInteger(amount) || amount < 1) return;

    setSelection((current) => {
      const next = new Map(current);
      next.set(id, (current.get(id) ?? 0) + amount);
      return next;
    });
  }, []);

  const remove = useCallback((itemId: string) => {
    setSelection((current) => {
      if (!current.has(itemId)) return current;
      const next = new Map(current);
      next.delete(itemId);
      return next;
    });
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    const id = itemId.trim();
    if (!id || !Number.isInteger(quantity)) return;

    setSelection((current) => {
      const next = new Map(current);
      if (quantity > 0) next.set(id, quantity);
      else next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelection(new Map()), []);
  const replace = useCallback(
    (nextSelection: ItemSelection) => setSelection(new Map(nextSelection)),
    [],
  );

  return { add, clear, remove, replace, selection, setQuantity };
}

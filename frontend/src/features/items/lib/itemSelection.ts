import type { ItemSelection } from "../types";

/** Parses Project Zomboid's repeated item IDs into quantities. */
export function parseItemSelection(value: string): ItemSelection {
  const selection = new Map<string, number>();
  for (const entry of value.split(",")) {
    const itemId = entry.trim();
    if (itemId) selection.set(itemId, (selection.get(itemId) ?? 0) + 1);
  }
  return selection;
}

/** Serializes quantities as repeated IDs because the game grants each ID once. */
export function serializeItemSelection(selection: ItemSelection): string {
  const items: string[] = [];
  for (const [itemId, quantity] of selection) {
    for (let count = 0; count < quantity; count += 1) items.push(itemId);
  }
  return items.join(",");
}

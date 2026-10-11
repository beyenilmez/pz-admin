import { describe, expect, it } from "vitest";
import type { ItemSelection } from "../types";
import { parseItemSelection, serializeItemSelection } from "./itemSelection";

describe("item selection serialization", () => {
  it("parses repeated IDs while trimming and ignoring empty entries", () => {
    const selection = parseItemSelection(
      " Base.Axe, ,Base.Hammer,Base.Axe,  ,Base.Hammer,Base.Hammer ",
    );

    expect([...selection]).toEqual([
      ["Base.Axe", 2],
      ["Base.Hammer", 3],
    ]);
  });

  it("serializes quantities in insertion order as repeated IDs", () => {
    const selection: ItemSelection = new Map([
      ["Base.Hammer", 1],
      ["Base.Axe", 3],
    ]);

    expect(serializeItemSelection(selection)).toBe(
      "Base.Hammer,Base.Axe,Base.Axe,Base.Axe",
    );
  });
});

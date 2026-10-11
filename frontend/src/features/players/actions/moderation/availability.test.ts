import { describe, expect, it } from "vitest";
import { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { hasProtectedModerationRole } from "./availability";

const cases = [
  { accessLevel: "admin", build: "41", expected: false },
  { accessLevel: "admin", build: "42", expected: true },
  { accessLevel: "Moderator", build: "42", expected: true },
  { accessLevel: "gm", build: "42", expected: false },
] satisfies readonly {
  accessLevel: string | null;
  build: GameBuild;
  expected: boolean;
}[];

describe("hasProtectedModerationRole", () => {
  it.each(cases)(
    "returns $expected for access level $accessLevel in Build $build",
    ({ accessLevel, build, expected }) => {
      const player = new Player({ accessLevel });

      expect(hasProtectedModerationRole(player, build)).toBe(expected);
    },
  );
});

import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";

export function hasProtectedModerationRole(player: Player, build: GameBuild) {
  if (build === "41") return false;

  const role = player.accessLevel?.toLowerCase();
  return role === "admin" || role === "moderator";
}

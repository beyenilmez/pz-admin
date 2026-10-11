import type { Player } from "@bindings/internal/player/models";
import {
  Teleport,
  TeleportToCoordinates,
} from "@bindings/internal/player/service";
import { executePlayerAction } from "../actionNotifications";

export function teleportToPlayer(targets: Player[], targetPlayerId: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Teleport(playerIds, targetPlayerId),
    successKey: "notifications.teleport.success",
  });
}

export function teleportToCoordinates(targets: Player[], coordinates: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => TeleportToCoordinates(playerIds, coordinates),
    successKey: "notifications.teleport.success",
  });
}

import type { Player } from "@bindings/internal/player/models";
import {
  CreateHorde,
  Lightning,
  Thunder,
} from "@bindings/internal/player/service";
import { executePlayerAction } from "../actionNotifications";

export function createHorde(targets: Player[], count: number) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => CreateHorde(playerIds, count),
    successKey: "notifications.createHorde.success",
  });
}

export function lightning(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Lightning(playerIds),
    successKey: "notifications.lightning.success",
  });
}

export function thunder(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Thunder(playerIds),
    successKey: "notifications.thunder.success",
  });
}

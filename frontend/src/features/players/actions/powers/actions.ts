import type { Player } from "@bindings/internal/player/models";
import {
  SetGodMode,
  SetInvisible,
  SetNoClip,
} from "@bindings/internal/player/service";
import { executePlayerAction } from "../actionNotifications";

export function setGodMode(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetGodMode(playerIds, enabled),
    successKey: enabled
      ? "notifications.godMode.enable.success"
      : "notifications.godMode.disable.success",
  });
}

export function setInvisible(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetInvisible(playerIds, enabled),
    successKey: enabled
      ? "notifications.invisible.enable.success"
      : "notifications.invisible.disable.success",
  });
}

export function setNoClip(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetNoClip(playerIds, enabled),
    successKey: enabled
      ? "notifications.noClip.enable.success"
      : "notifications.noClip.disable.success",
  });
}

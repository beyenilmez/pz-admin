import type { Player } from "@bindings/internal/player/models";

export function isOnline(player: Player) {
  const lastSeen = playerTimestamp(player.lastSeenOnlineAt);
  const lastKnownOffline = playerTimestamp(player.lastKnownOfflineAt);
  return lastSeen > lastKnownOffline;
}

export function playerTimestamp(value: Date) {
  return value.getTime();
}

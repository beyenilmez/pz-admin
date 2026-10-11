import type { Player } from "@bindings/internal/player/models";

const unknownAccessLevelRank = -2;

export function accessLevelKey(accessLevel: string | null | undefined) {
  switch (accessLevel?.toLowerCase()) {
    case "none":
      return "none";
    case "user":
      return "user";
    case "priority":
      return "priority";
    case "banned":
      return "banned";
    case "gm":
      return "gm";
    case "admin":
      return "admin";
    case "moderator":
      return "moderator";
    case "overseer":
      return "overseer";
    case "observer":
      return "observer";
    default:
      return "unknown";
  }
}

export function accessLevelColor(accessLevel: string | null | undefined) {
  switch (accessLevel?.toLowerCase()) {
    case "admin":
      return "orange";
    case "banned":
      return "red";
    case "moderator":
      return "green";
    case "overseer":
      return "cyan";
    case "gm":
      return "yellow";
    case "observer":
      return "gray";
    case "priority":
      return "violet";
    case "user":
    case "none":
      return "blue";
    default:
      return "gray";
  }
}

export function accessLevelRank(accessLevel: string | null | undefined) {
  switch (accessLevel?.toLowerCase()) {
    case "admin":
      return 6;
    case "moderator":
      return 5;
    case "overseer":
      return 4;
    case "gm":
      return 3;
    case "observer":
      return 2;
    case "priority":
      return 1;
    case "banned":
      return -1;
    case "user":
    case "none":
      return 0;
    default:
      return unknownAccessLevelRank;
  }
}

export function hasKnownAccessLevel(accessLevel: string | null | undefined) {
  return accessLevelRank(accessLevel) !== unknownAccessLevelRank;
}

export function playerAccessLevel(player: Player) {
  return player.banned ? "banned" : player.accessLevel;
}

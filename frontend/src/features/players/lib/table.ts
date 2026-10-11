import type { Player } from "@bindings/internal/player/models";
import {
  accessLevelRank,
  hasKnownAccessLevel,
  playerAccessLevel,
} from "./accessLevel";
import { isOnline, playerTimestamp } from "../status";

export type SortColumn = "accessLevel" | "lastSeen" | "username";
export type SortDirection = "asc" | "desc";

export interface PlayerSorting {
  column: SortColumn;
  direction: SortDirection;
}

export function lastSeenLabel(
  player: Player,
  relativeTime: Intl.RelativeTimeFormat,
) {
  const lastSeen = playerTimestamp(player.lastSeenOnlineAt);
  if (lastSeen <= 0) return null;

  const elapsed = Date.now() - lastSeen;
  if (isOnline(player)) return "online";

  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return relativeTime.format(-minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeTime.format(-hours, "hour");

  return relativeTime.format(-Math.floor(hours / 24), "day");
}

export function filterAndSortPlayers(
  players: Player[],
  search: string,
  language: string,
  sorting: PlayerSorting,
) {
  const query = search.trim().toLocaleLowerCase(language);
  const direction = sorting.direction === "asc" ? 1 : -1;

  const filteredPlayers = players.filter((player) =>
    player.username.toLocaleLowerCase(language).includes(query),
  );
  filteredPlayers.sort((firstPlayer, secondPlayer) => {
    if (sorting.column === "accessLevel") {
      const firstUnknown = !hasKnownAccessLevel(playerAccessLevel(firstPlayer));
      const secondUnknown = !hasKnownAccessLevel(
        playerAccessLevel(secondPlayer),
      );
      if (firstUnknown !== secondUnknown) return firstUnknown ? 1 : -1;
    }

    let comparison: number;
    switch (sorting.column) {
      case "username":
        comparison = firstPlayer.username.localeCompare(
          secondPlayer.username,
          language,
        );
        break;
      case "lastSeen":
        comparison =
          playerTimestamp(firstPlayer.lastSeenOnlineAt) -
          playerTimestamp(secondPlayer.lastSeenOnlineAt);
        break;
      case "accessLevel":
        comparison =
          accessLevelRank(playerAccessLevel(firstPlayer)) -
          accessLevelRank(playerAccessLevel(secondPlayer));
        break;
    }
    if (comparison === 0) {
      comparison = firstPlayer.username.localeCompare(
        secondPlayer.username,
        language,
      );
    }
    return comparison * direction;
  });
  return filteredPlayers;
}

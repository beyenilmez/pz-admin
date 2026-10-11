import { Player } from "@bindings/internal/player/models";

// Hours offline: 0 means online, null means never seen.
const roster = [
  ["jack", "admin", 0],
  ["kate", "moderator", 0],
  ["sawyer", "user", 0],
  ["hurley", "user", 0],
  ["locke", "overseer", 0],
  ["sayid", "gm", 26],
  ["desmond", "observer", 52],
  ["juliet", "priority", null],
  ["ben", "banned", 104],
] as const;

type PlayerUsername = (typeof roster)[number][0];

export function makePlayers(...usernames: PlayerUsername[]) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return roster
    .filter(
      ([username]) => usernames.length === 0 || usernames.includes(username),
    )
    .map(
      ([username, accessLevel, hoursOffline]) =>
        new Player({
          id: username,
          username,
          accessLevel: accessLevel === "banned" ? "user" : accessLevel,
          banned: accessLevel === "banned",
          godMode: username === "jack",
          // Relative offsets keep last-seen labels stable between captures.
          firstSeenAt: new Date(now - 30 * 24 * hour),
          lastSeenOnlineAt: new Date(
            hoursOffline === null ? 0 : now - hoursOffline * hour,
          ),
          lastKnownOfflineAt: new Date(now - (hoursOffline === 0 ? hour : 0)),
        }),
    );
}

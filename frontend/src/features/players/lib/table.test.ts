import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "@bindings/internal/player/models";
import {
  filterAndSortPlayers,
  lastSeenLabel,
  type PlayerSorting,
} from "./table";

const now = Date.parse("2026-08-31T12:00:00.000Z");

function player(username: string, overrides: Partial<Player> = {}): Player {
  return new Player({
    firstSeenAt: new Date(0),
    id: username.toLocaleLowerCase(),
    lastKnownOfflineAt: new Date(0),
    lastSeenOnlineAt: new Date(0),
    username,
    ...overrides,
  });
}

function sortedUsernames(
  players: Player[],
  sorting: PlayerSorting,
  search = "",
  language = "en-US",
) {
  return filterAndSortPlayers(players, search, language, sorting).map(
    ({ username }) => username,
  );
}

const relativeTime = {
  format: vi.fn(
    (value: number, unit: Intl.RelativeTimeFormatUnit) => `${value}:${unit}`,
  ),
  formatToParts: vi.fn(() => []),
  resolvedOptions: vi.fn(() => ({
    locale: "test",
    numberingSystem: "latn",
    numeric: "always" as const,
    style: "long" as const,
  })),
} satisfies Intl.RelativeTimeFormat;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("filterAndSortPlayers", () => {
  it("searches with trimmed locale-aware case folding", () => {
    const players = [player("Alice"), player("IŞIK"), player("Şule")];

    expect(
      sortedUsernames(
        players,
        { column: "username", direction: "asc" },
        "  ış  ",
        "tr",
      ),
    ).toEqual(["IŞIK"]);
  });

  it("sorts usernames in the requested direction", () => {
    const players = [player("Bravo"), player("Alpha"), player("Zulu")];

    expect(
      sortedUsernames(players, { column: "username", direction: "desc" }),
    ).toEqual(["Zulu", "Bravo", "Alpha"]);
  });

  it("sorts access levels while keeping unknown roles last", () => {
    const players = [
      player("Unknown", { accessLevel: "custom-role" }),
      player("Admin", { accessLevel: "admin" }),
      player("Banned", { accessLevel: "admin", banned: true }),
      player("User", { accessLevel: "none" }),
    ];

    expect(
      sortedUsernames(players, { column: "accessLevel", direction: "asc" }),
    ).toEqual(["Banned", "User", "Admin", "Unknown"]);
  });
});

describe("lastSeenLabel", () => {
  it("returns no label for the generated never-seen timestamp", () => {
    const neverSeen = new Player({ id: "never-seen", username: "Never seen" });

    expect(lastSeenLabel(neverSeen, relativeTime)).toBeNull();
    expect(relativeTime.format).not.toHaveBeenCalled();
  });

  it("returns the online state without relative formatting", () => {
    const onlinePlayer = player("Online", {
      lastKnownOfflineAt: new Date(now - 1),
      lastSeenOnlineAt: new Date(now),
    });

    expect(lastSeenLabel(onlinePlayer, relativeTime)).toBe("online");
    expect(relativeTime.format).not.toHaveBeenCalled();
  });

  it("formats offline time in useful minute, hour, and day units", () => {
    function label(elapsed: number) {
      return lastSeenLabel(
        player("Offline", {
          lastKnownOfflineAt: new Date(now),
          lastSeenOnlineAt: new Date(now - elapsed),
        }),
        relativeTime,
      );
    }

    expect(label(1)).toBe("-1:minute");
    expect(label(2 * 60 * 60_000)).toBe("-2:hour");
    expect(label(3 * 24 * 60 * 60_000)).toBe("-3:day");
  });
});

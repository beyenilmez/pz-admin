import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifications } from "@mantine/notifications";
import {
  ActionFailure,
  ActionResult,
  Player,
} from "@bindings/internal/player/models";
import {
  executePlayerAction,
  executePlayerOperation,
} from "./actionNotifications";

const { getFixedT, translate } = vi.hoisted(() => {
  const translationFunction = vi.fn((key: string) => `translated:${key}`);
  return {
    getFixedT: vi.fn((language: unknown, namespace: unknown) => {
      if (language !== null || namespace !== "players") {
        throw new Error("Expected the players translation namespace");
      }
      return translationFunction;
    }),
    translate: translationFunction,
  };
});

vi.mock("@/i18n", () => ({
  default: { getFixedT, t: translate },
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

const players = [
  new Player({ id: "alpha", username: "Alice" }),
  new Player({ id: "bravo", username: "Bob" }),
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("executePlayerAction", () => {
  it("forwards target IDs and reports a full success", async () => {
    const execute = vi.fn(async (_playerIds: string[]) =>
      Promise.resolve(
        new ActionResult({ succeeded: [players[0].id, players[1].id] }),
      ),
    );

    const succeeded = await executePlayerAction({
      execute,
      successKey: "notifications.spawnVehicle.success",
      successValues: { vehicle: "Ambulance" },
      targets: players,
    });

    expect(succeeded).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith([players[0].id, players[1].id]);
    expect(translate).toHaveBeenCalledWith(
      "notifications.spawnVehicle.success",
      {
        count: players.length,
        username: players[0].username,
        vehicle: "Ambulance",
      },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      title: "translated:notifications.action.success.title",
      message: "translated:notifications.spawnVehicle.success",
    });
  });

  it("reports a partial structured failure with result counts", async () => {
    const execute = vi.fn(async (_playerIds: string[]) =>
      Promise.resolve(
        new ActionResult({
          failed: [
            new ActionFailure({
              message: "rcon: permission denied",
              playerId: players[1].id,
            }),
          ],
          succeeded: [players[0].id],
        }),
      ),
    );

    const succeeded = await executePlayerAction({
      execute,
      successKey: "notifications.kick.success",
      targets: players,
    });

    expect(succeeded).toBe(false);
    expect(translate).toHaveBeenCalledWith(
      "notifications.partialFailure.message",
      {
        error: "rcon: permission denied",
        failedCount: 1,
        succeededCount: 1,
        totalCount: 2,
      },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      color: "yellow",
      title: "translated:notifications.partialFailure.title",
      message: "translated:notifications.partialFailure.message",
    });
  });

  it("returns false and reports a thrown action error", async () => {
    const execute = vi.fn(async (_playerIds: string[]) =>
      Promise.reject(new Error("transport: connection lost")),
    );

    const succeeded = await executePlayerAction({
      execute,
      successKey: "notifications.kick.success",
      targets: players,
    });

    expect(succeeded).toBe(false);
    expect(execute).toHaveBeenCalledWith([players[0].id, players[1].id]);
    expect(translate).toHaveBeenCalledWith("notifications.failure.message", {
      error: "transport: connection lost",
    });
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      color: "red",
      title: "translated:notifications.action.failure.title",
      message: "translated:notifications.failure.message",
    });
  });
});

describe("executePlayerOperation", () => {
  it("reports success with operation-specific values", async () => {
    const execute = vi.fn(async () => Promise.resolve());

    const succeeded = await executePlayerOperation({
      execute,
      successKey: "notifications.addServerUser.success",
      successValues: { username: "Carol" },
    });

    expect(succeeded).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith();
    expect(translate).toHaveBeenCalledWith(
      "notifications.addServerUser.success",
      { username: "Carol" },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      title: "translated:notifications.action.success.title",
      message: "translated:notifications.addServerUser.success",
    });
  });
});

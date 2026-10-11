import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddVehicle, Ban, SetGodMode } from "@bindings/internal/player/service";
import { ActionResult, Player } from "@bindings/internal/player/models";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import {
  executePlayerAction,
  executePlayerOperation,
} from "./actionNotifications";
import { spawnVehicle } from "./give/actions";
import { ban } from "./moderation/actions";
import { setGodMode } from "./powers/actions";

vi.mock("@bindings/internal/player/service", () => ({
  AddVehicle: vi.fn(),
  Ban: vi.fn(),
  SetGodMode: vi.fn(),
}));

vi.mock("./actionNotifications", () => ({
  executePlayerAction: vi.fn(),
  executePlayerOperation: vi.fn(),
}));

const players = [
  new Player({ id: "bravo", username: "Bob" }),
  new Player({ id: "alpha", username: "Alice" }),
];
const playerIds = players.map(({ id }) => id);
const successfulResult = new ActionResult({ succeeded: playerIds });

beforeEach(() => {
  vi.mocked(executePlayerAction).mockImplementation(
    async ({ execute, targets }) => {
      await execute(targets.map(({ id }) => id));
      return true;
    },
  );
  vi.mocked(executePlayerOperation).mockImplementation(async ({ execute }) => {
    await execute();
    return true;
  });
  vi.mocked(AddVehicle).mockResolvedValue(successfulResult);
  vi.mocked(Ban).mockResolvedValue(successfulResult);
  vi.mocked(SetGodMode).mockResolvedValue(successfulResult);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("player action binding routes", () => {
  it("routes a destructive moderation reason and IP flag", async () => {
    const result = await ban(players, "Repeated griefing", true);

    expect(result).toBe(true);
    expect(Ban).toHaveBeenCalledOnce();
    expect(Ban).toHaveBeenCalledWith(playerIds, "Repeated griefing", true);
    expect(executePlayerAction).toHaveBeenCalledWith({
      execute: expect.any(Function),
      successKey: "notifications.ban.success",
      targets: players,
    });
  });

  it("routes the vehicle ID while retaining its display name for success", async () => {
    const vehicle = {
      build: "42",
      category: "Emergency",
      id: "Base.Ambulance",
      image: null,
      name: "Ambulance",
      stats: {},
      variant: null,
    } satisfies VehicleCatalogEntry;

    const result = await spawnVehicle(players, vehicle);

    expect(result).toBe(true);
    expect(AddVehicle).toHaveBeenCalledOnce();
    expect(AddVehicle).toHaveBeenCalledWith(playerIds, vehicle.id);
    expect(executePlayerAction).toHaveBeenCalledWith({
      execute: expect.any(Function),
      successKey: "notifications.spawnVehicle.success",
      successValues: { vehicle: vehicle.name },
      targets: players,
    });
  });

  it("routes the disabled state and selects the matching power message", async () => {
    const result = await setGodMode(players, false);

    expect(result).toBe(true);
    expect(SetGodMode).toHaveBeenCalledOnce();
    expect(SetGodMode).toHaveBeenCalledWith(playerIds, false);
    expect(executePlayerAction).toHaveBeenCalledWith({
      execute: expect.any(Function),
      successKey: "notifications.godMode.disable.success",
      targets: players,
    });
  });
});

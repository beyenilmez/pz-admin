import type {
  ItemGrant,
  Player,
  XPGrant,
} from "@bindings/internal/player/models";
import { AddItems, AddVehicle, AddXP } from "@bindings/internal/player/service";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { executePlayerAction } from "../actionNotifications";

export function spawnVehicle(targets: Player[], vehicle: VehicleCatalogEntry) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => AddVehicle(playerIds, vehicle.id),
    successKey: "notifications.spawnVehicle.success",
    successValues: { vehicle: vehicle.name },
  });
}

export function giveItems(targets: Player[], items: ItemGrant[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => AddItems(playerIds, items),
    successKey: "notifications.giveItems.success",
  });
}

export function addXp(targets: Player[], grants: XPGrant[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => AddXP(playerIds, grants),
    successKey: "notifications.addXp.success",
  });
}

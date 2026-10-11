import { publicAssetUrl } from "@/shared/lib/publicAssetUrl";
import type { VehicleStats } from "../types";

// The icons come from PZwiki's vehicle stat legend. The game artwork remains
// copyright The Indie Stone: https://pzwiki.net/wiki/Vehicle
export const vehicleStatIcons: Partial<Record<keyof VehicleStats, string>> = {
  animalSize: publicAssetUrl("/vehicles/stats/animal-size.png"),
  doors: publicAssetUrl("/vehicles/stats/doors.png"),
  engineLoudness: publicAssetUrl("/vehicles/stats/engine-loudness.png"),
  enginePower: publicAssetUrl("/vehicles/stats/engine-power.png"),
  engineQuality: publicAssetUrl("/vehicles/stats/engine-quality.png"),
  gloveBox: publicAssetUrl("/vehicles/stats/glove-box.png"),
  lightbar: publicAssetUrl("/vehicles/stats/lightbar.png"),
  occupantProtection: publicAssetUrl("/vehicles/stats/occupant-protection.png"),
  seats: publicAssetUrl("/vehicles/stats/seats.png"),
  suspensionStiffness: publicAssetUrl(
    "/vehicles/stats/suspension-stiffness.png",
  ),
  topSpeed: publicAssetUrl("/vehicles/stats/top-speed.png"),
  totalStorage: publicAssetUrl("/vehicles/stats/storage.png"),
  trunkStorage: publicAssetUrl("/vehicles/stats/trunk-storage.png"),
  weight: publicAssetUrl("/vehicles/stats/weight.png"),
  wheels: publicAssetUrl("/vehicles/stats/wheels.png"),
};

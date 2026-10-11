import { describe, expect, it } from "vitest";
import vehicleCatalog from "@/i18n/resources/tr-TR/vehicleCatalog.json";
import { loadVehicleCatalog } from "./catalog";

describe("vehicle catalog translations", () => {
  it("applies vehicleCatalog namespace translations across builds", async () => {
    const build41 = await loadVehicleCatalog("41", "tr-TR");
    const build42 = await loadVehicleCatalog("42", "tr-TR");

    expect(build41.hierarchy.find(({ id }) => id === "Heavy-Duty")?.name).toBe(
      vehicleCatalog.categories["Heavy-Duty"],
    );
    expect(build41.vehiclesById.get("Base.VanAmbulance")?.name).toBe(
      vehicleCatalog.models.Ambulance,
    );
    expect(build42.vehiclesById.get("Base.Trailer_Horsebox")?.name).toBe(
      vehicleCatalog.models["Horse trailer"],
    );
  });
});

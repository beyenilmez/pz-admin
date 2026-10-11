import type { TFunction } from "i18next";
import { formatNumber, formatUnit } from "@/shared/lib/numberFormat";
import type { VehicleNumericStat, VehicleStats } from "../types";

export const vehicleNumericStats = [
  "enginePower",
  "topSpeed",
  "seats",
  "totalStorage",
  "trunkStorage",
  "weight",
  "engineQuality",
  "engineLoudness",
  "suspensionStiffness",
  "occupantProtection",
  "gloveBox",
  "offRoadEfficiency",
  "rollInfluence",
  "doors",
  "wheels",
  "animalSize",
] as const satisfies readonly VehicleNumericStat[];

export type VehicleRangeFilterStat = (typeof vehicleNumericStats)[number];

export type VehicleRangeFilters = Partial<
  Record<VehicleRangeFilterStat, [number, number]>
>;

export const vehicleSortFields = [
  "name",
  "enginePower",
  "topSpeed",
  "seats",
  "totalStorage",
  "trunkStorage",
  "weight",
] as const;

export const vehicleDetailSections = [
  {
    key: "performance",
    stats: [
      "enginePower",
      "topSpeed",
      "engineQuality",
      "engineLoudness",
      "weight",
      "suspensionStiffness",
      "offRoadEfficiency",
      "rollInfluence",
    ],
  },
  {
    key: "capacity",
    stats: ["seats", "totalStorage", "trunkStorage", "gloveBox", "animalSize"],
  },
  {
    key: "body",
    stats: ["occupantProtection", "doors", "wheels", "lightbar"],
  },
] as const satisfies ReadonlyArray<{
  key: "body" | "capacity" | "performance";
  stats: readonly (keyof VehicleStats)[];
}>;

export function formatVehicleStat(
  t: TFunction<"vehicles">,
  locale: string,
  stat: keyof VehicleStats,
  value: boolean | number | undefined,
): string {
  if (value === undefined) return "—";
  if (stat === "lightbar") {
    return t(
      value ? "filters.boolean.options.yes" : "filters.boolean.options.no",
    );
  }
  if (typeof value !== "number") return String(value);
  if (stat === "enginePower") {
    return t("stats.values.enginePower", {
      value: formatNumber(locale, value),
    });
  }
  if (stat === "topSpeed") {
    return formatUnit(locale, value, "kilometer-per-hour");
  }
  if (stat === "weight") return formatUnit(locale, value, "kilogram");
  if (stat === "seats") {
    return t("stats.values.seats", {
      count: value,
      value: formatNumber(locale, value),
    });
  }
  if (
    stat === "gloveBox" ||
    stat === "totalStorage" ||
    stat === "trunkStorage"
  ) {
    return t("stats.values.storage", {
      count: value,
      value: formatNumber(locale, value),
    });
  }
  return formatNumber(locale, value);
}

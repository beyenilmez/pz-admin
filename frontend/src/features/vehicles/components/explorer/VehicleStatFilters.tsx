import {
  Group,
  Image,
  RangeSlider,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { vehicleStatIcons } from "@/features/vehicles/lib/statIcons";
import {
  type VehicleRangeFilterStat,
  type VehicleRangeFilters,
} from "@/features/vehicles/lib/stats";
import type {
  VehicleNumericStat,
  VehicleStatRange,
} from "@/features/vehicles/types";

interface VehicleStatFiltersProps {
  onChange: (stat: VehicleRangeFilterStat, value: [number, number]) => void;
  ranges: Partial<Record<VehicleNumericStat, VehicleStatRange>>;
  stats: readonly VehicleRangeFilterStat[];
  values: VehicleRangeFilters;
}

interface VehicleStatFilterControlProps {
  label: string;
  onChange: (value: [number, number]) => void;
  range: VehicleStatRange;
  stat: VehicleRangeFilterStat;
  value: [number, number];
}

function VehicleStatFilterControl({
  label,
  onChange,
  range,
  stat,
  value,
}: VehicleStatFilterControlProps) {
  const [draft, setDraft] = useState(value);
  const [minimum, maximum] = value;
  const icon = vehicleStatIcons[stat];

  useEffect(() => {
    setDraft([minimum, maximum]);
  }, [maximum, minimum]);

  return (
    <Stack gap={6}>
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Group gap={5} miw={0} wrap="nowrap">
          {icon ? (
            <Image aria-hidden="true" fit="contain" h={16} src={icon} w={16} />
          ) : null}
          <Text fw={500} fz={13}>
            {label}
          </Text>
        </Group>
        <Text
          c="dimmed"
          fz={12}
          style={{
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {draft[0]}–{draft[1]}
        </Text>
      </Group>

      <RangeSlider
        aria-label={label}
        label={null}
        max={range.maximum}
        min={range.minimum}
        minRange={0}
        onChange={setDraft}
        onChangeEnd={onChange}
        size="sm"
        step={
          Number.isInteger(range.minimum) && Number.isInteger(range.maximum)
            ? 1
            : 0.1
        }
        value={draft}
      />
    </Stack>
  );
}

interface VehicleLightbarFilterProps {
  onChange: (value: boolean | null) => void;
  value: boolean | null;
}

export function VehicleLightbarFilter({
  onChange,
  value,
}: VehicleLightbarFilterProps) {
  const { t } = useTranslation("vehicles");
  const icon = vehicleStatIcons.lightbar;

  return (
    <Stack gap={6} pb="xs">
      <Group gap={5} wrap="nowrap">
        {icon ? (
          <Image aria-hidden="true" fit="contain" h={16} src={icon} w={16} />
        ) : null}
        <Text fw={500} fz={13}>
          {t("stats.lightbar")}
        </Text>
      </Group>
      <SegmentedControl
        aria-label={t("stats.lightbar")}
        data={[
          { label: t("filters.boolean.options.any"), value: "any" },
          { label: t("filters.boolean.options.yes"), value: "yes" },
          { label: t("filters.boolean.options.no"), value: "no" },
        ]}
        fullWidth
        onChange={(nextValue) => {
          onChange(nextValue === "any" ? null : nextValue === "yes");
        }}
        size="xs"
        value={value === null ? "any" : value ? "yes" : "no"}
      />
    </Stack>
  );
}

export function VehicleStatFilters({
  onChange,
  ranges,
  stats,
  values,
}: VehicleStatFiltersProps) {
  const { t } = useTranslation("vehicles");

  return (
    <Stack gap="md" pb="xs">
      {stats.map((stat) => {
        const range = ranges[stat];
        if (!range || range.minimum === range.maximum) return null;

        const value = values[stat] ?? [range.minimum, range.maximum];
        const label = t(`stats.${stat}`);

        return (
          <VehicleStatFilterControl
            key={stat}
            label={label}
            onChange={(nextValue) => onChange(stat, nextValue)}
            range={range}
            stat={stat}
            value={value}
          />
        );
      })}
    </Stack>
  );
}

import { Fragment } from "react";
import {
  Box,
  Group,
  Image,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { vehicleStatIcons } from "@/features/vehicles/lib/statIcons";
import { formatVehicleStat } from "@/features/vehicles/lib/stats";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { VehicleIdCopyButton } from "../details/VehicleIdCopyButton";
import classes from "./VehiclePicker.module.css";

const summaryStats = [
  "seats",
  "totalStorage",
  "trunkStorage",
  "enginePower",
  "topSpeed",
  "engineQuality",
  "weight",
] as const;

const summaryStatLabelKeys = {
  enginePower: "stats.enginePower",
  engineQuality: "stats.engineQuality",
  seats: "stats.seats",
  topSpeed: "stats.topSpeed",
  totalStorage: "stats.totalStorage",
  trunkStorage: "stats.trunkStorage",
  weight: "stats.weight",
} as const;

interface VehiclePickerSelectionProps {
  onChange: (vehicle: VehicleCatalogEntry) => void;
  selectedVehicle: VehicleCatalogEntry;
  variants: VehicleCatalogEntry[];
}

export function VehiclePickerSelection({
  onChange,
  selectedVehicle,
  variants,
}: VehiclePickerSelectionProps) {
  const { i18n, t } = useTranslation("vehicles");

  return (
    <Stack gap="md" h={0} p="xs" style={{ flex: 1, minHeight: 0 }}>
      <Box className={classes.summary}>
        <Box className={classes.preview}>
          {selectedVehicle.image ? (
            <Image
              alt=""
              fit="contain"
              h={140}
              src={selectedVehicle.image}
              style={{ transform: "scale(1.32)" }}
            />
          ) : (
            <IconCar
              aria-hidden="true"
              color="var(--mantine-color-dimmed)"
              size={52}
            />
          )}
        </Box>
        <Stack gap="xs" miw={0}>
          <Stack gap={0}>
            <Text fw={600} size="lg">
              {selectedVehicle.name}
            </Text>
            {selectedVehicle.variant ? (
              <Text c="dimmed" size="sm">
                {selectedVehicle.variant}
              </Text>
            ) : null}
          </Stack>
          <VehicleIdCopyButton id={selectedVehicle.id} />
        </Stack>
        <Box className={classes.summaryStats}>
          {summaryStats
            .filter((stat) => selectedVehicle.stats[stat] !== undefined)
            .map((stat) => (
              <Fragment key={stat}>
                <Group gap={4} wrap="nowrap">
                  <Image
                    aria-hidden="true"
                    fit="contain"
                    h={16}
                    src={vehicleStatIcons[stat]}
                    w={16}
                  />
                  <Text c="dimmed" fz={12} lh={1.15}>
                    {t(summaryStatLabelKeys[stat])}
                  </Text>
                </Group>
                <Text fw={500} fz={13} lh={1.15}>
                  {formatVehicleStat(
                    t,
                    i18n.language,
                    stat,
                    selectedVehicle.stats[stat],
                  )}
                </Text>
              </Fragment>
            ))}
        </Box>
      </Box>

      {variants.length > 1 ? (
        <Stack gap="xs" h={0} style={{ flex: 1, minHeight: 0 }}>
          <Text fw={600} size="sm">
            {t("variants.title")}
          </Text>
          <ScrollArea
            h={0}
            offsetScrollbars
            overscrollBehavior="contain"
            style={{ flex: 1, minHeight: 0 }}
            type="auto"
          >
            <SimpleGrid
              cols={{ base: 2, "18rem": 3, "30rem": 4, "42rem": 6 }}
              spacing="xs"
              type="container"
            >
              {variants.map((variant) => {
                const label = variant.variant ?? variant.name;
                const selected = variant.id === selectedVehicle.id;
                return (
                  <Tooltip key={variant.id} label={label} withArrow>
                    <UnstyledButton
                      aria-current={selected ? "true" : undefined}
                      aria-label={t("picker.actions.selectVariant", {
                        variant: label,
                      })}
                      className={classes.variant}
                      data-selected={selected || undefined}
                      onClick={() => onChange(variant)}
                    >
                      {variant.image ? (
                        <Image
                          alt=""
                          fit="contain"
                          h={78}
                          loading="lazy"
                          src={variant.image}
                          style={{
                            transform: "translate(4px, -7px) scale(1.34)",
                          }}
                        />
                      ) : (
                        <IconCar
                          aria-hidden="true"
                          color="var(--mantine-color-dimmed)"
                          size={28}
                        />
                      )}
                      <Text
                        className={classes.variantLabel}
                        fw={600}
                        lineClamp={1}
                        size="xs"
                      >
                        {label}
                      </Text>
                    </UnstyledButton>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </ScrollArea>
        </Stack>
      ) : null}
    </Stack>
  );
}

import { memo, type ReactNode } from "react";
import {
  Box,
  Grid,
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import { vehicleStatIcons } from "@/features/vehicles/lib/statIcons";
import { formatVehicleStat } from "@/features/vehicles/lib/stats";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import classes from "./VehicleResultsList.module.css";

const summaryStats = [
  "totalStorage",
  "seats",
  "enginePower",
  "topSpeed",
] as const;
const summaryStatLabels = {
  enginePower: "stats.short.enginePower",
  seats: "stats.seats",
  topSpeed: "stats.short.topSpeed",
  totalStorage: "stats.short.totalStorage",
} as const;

interface VehicleResultsListProps {
  loading: boolean;
  onVehicleSelect: (vehicle: VehicleCatalogEntry) => void;
  vehicles: VehicleCatalogEntry[];
}

interface VehicleStatProps {
  icon?: string;
  label: string;
  value: ReactNode;
}

function VehicleStat({ icon, label, value }: VehicleStatProps) {
  return (
    <Stack gap={1}>
      <Group gap={4} wrap="nowrap">
        {icon ? (
          <Image aria-hidden="true" fit="contain" h={16} src={icon} w={16} />
        ) : null}
        <Text c="dimmed" fz={11} lh={1.2}>
          {label}
        </Text>
      </Group>
      <Text fw={500} fz={13}>
        {value}
      </Text>
    </Stack>
  );
}

export const VehicleResultsList = memo(function VehicleResultsList({
  loading,
  onVehicleSelect,
  vehicles,
}: VehicleResultsListProps) {
  const { i18n, t } = useTranslation("vehicles");
  const skeleton = useSkeletonVisibility(loading);

  return (
    <Paper className={classes.root} withBorder>
      <ScrollArea className={classes.scrollArea} h="100%" type="auto">
        <Box aria-busy={loading} component="ul" m={0} p={0}>
          {skeleton.visible
            ? Array.from({ length: 12 }, (_row, index) => (
                <Box
                  component="li"
                  className={classes.item}
                  data-skeleton
                  key={index}
                  px="md"
                  py="sm"
                >
                  <Grid align="center" gap="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap={0} wrap="nowrap">
                        <Box
                          className={classes.skeletonThumbnail}
                          h={76}
                          ms="calc(-1 * var(--mantine-spacing-md))"
                          my="calc(-1 * var(--mantine-spacing-sm))"
                        >
                          <Skeleton h="100%" radius={0} w="100%" />
                        </Box>
                        <Stack gap={6} flex={1} miw={0}>
                          <Skeleton height={16} width="65%" />
                          <Skeleton height={13} width="45%" />
                        </Stack>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <SimpleGrid cols={4} spacing="sm">
                        {Array.from({ length: 4 }, (_stat, statIndex) => (
                          <Stack gap={5} key={statIndex}>
                            <Skeleton height={10} width="70%" />
                            <Skeleton height={14} width="45%" />
                          </Stack>
                        ))}
                      </SimpleGrid>
                    </Grid.Col>
                  </Grid>
                </Box>
              ))
            : skeleton.active
              ? null
              : vehicles.map((vehicle) => (
                  <Box
                    className={classes.item}
                    component="li"
                    data-content
                    key={vehicle.id}
                  >
                    <UnstyledButton
                      className={classes.row}
                      id={`vehicle-result-${vehicle.id}`}
                      onClick={() => onVehicleSelect(vehicle)}
                      px="md"
                      py="sm"
                    >
                      <Grid align="center" gap="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Group gap={0} wrap="nowrap">
                            <Box
                              className={classes.thumbnail}
                              h={76}
                              ms="calc(-1 * var(--mantine-spacing-md))"
                              my="calc(-1 * var(--mantine-spacing-sm))"
                            >
                              {vehicle.image ? (
                                <Image
                                  alt=""
                                  fit="contain"
                                  h={76}
                                  loading="lazy"
                                  src={vehicle.image}
                                  className={classes.image}
                                  w={120}
                                />
                              ) : (
                                <IconCar
                                  aria-hidden="true"
                                  color="var(--mantine-color-dimmed)"
                                  size={24}
                                />
                              )}
                            </Box>

                            <Stack gap={3} miw={0}>
                              <Text fw={500} lineClamp={1} size="sm">
                                {vehicle.name}
                              </Text>
                              {vehicle.variant ? (
                                <Text c="dimmed" lineClamp={1} size="xs">
                                  {vehicle.variant}
                                </Text>
                              ) : null}
                            </Stack>
                          </Group>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <SimpleGrid cols={4} spacing="sm">
                            {summaryStats.map((stat) => (
                              <VehicleStat
                                icon={vehicleStatIcons[stat]}
                                key={stat}
                                label={t(summaryStatLabels[stat])}
                                value={formatVehicleStat(
                                  t,
                                  i18n.language,
                                  stat,
                                  vehicle.stats[stat],
                                )}
                              />
                            ))}
                          </SimpleGrid>
                        </Grid.Col>
                      </Grid>
                    </UnstyledButton>
                  </Box>
                ))}
        </Box>

        {!loading && vehicles.length === 0 ? (
          <Text c="dimmed" py="xl" ta="center">
            {t("browser.search.empty")}
          </Text>
        ) : null}
      </ScrollArea>
    </Paper>
  );
});

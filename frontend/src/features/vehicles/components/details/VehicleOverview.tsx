import type { RefObject } from "react";
import {
  Badge,
  Box,
  Divider,
  Grid,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { vehicleStatIcons } from "@/features/vehicles/lib/statIcons";
import {
  formatVehicleStat,
  vehicleDetailSections,
} from "@/features/vehicles/lib/stats";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { VehicleIdCopyButton } from "./VehicleIdCopyButton";
import classes from "./VehicleDetails.module.css";

interface VehicleOverviewProps {
  titleRef: RefObject<HTMLHeadingElement | null>;
  vehicle: VehicleCatalogEntry;
}

export function VehicleOverview({ titleRef, vehicle }: VehicleOverviewProps) {
  const { i18n, t } = useTranslation("vehicles");

  return (
    <Paper className={classes.scrollPanel} h="100%" p="md" withBorder>
      <Stack gap="md">
        <Grid align="flex-start" gap="md">
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <Box className={classes.preview}>
              {vehicle.image ? (
                <Image
                  alt=""
                  fit="contain"
                  h={160}
                  src={vehicle.image}
                  style={{ transform: "scale(1.32)" }}
                />
              ) : (
                <IconCar
                  aria-hidden="true"
                  color="var(--mantine-color-dimmed)"
                  size={64}
                />
              )}
              <Badge
                bottom="var(--mantine-spacing-xs)"
                color="gray"
                pos="absolute"
                right="var(--mantine-spacing-xs)"
                size="sm"
                variant="light"
              >
                {vehicle.category}
              </Badge>
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 7 }}>
            <Stack gap="xs">
              <Stack gap={0}>
                <Title
                  fw={600}
                  order={1}
                  ref={titleRef}
                  size="h3"
                  tabIndex={-1}
                >
                  {vehicle.name}
                </Title>
                {vehicle.variant ? (
                  <Text c="dimmed" size="sm">
                    {vehicle.variant}
                  </Text>
                ) : null}
              </Stack>
              <VehicleIdCopyButton id={vehicle.id} />
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider />

        {vehicleDetailSections.map((section) => {
          const stats = section.stats.flatMap((stat) => {
            const value =
              stat === "lightbar"
                ? (vehicle.stats.lightbar ?? false)
                : vehicle.stats[stat];
            return value === undefined ? [] : [{ stat, value }];
          });
          if (stats.length === 0) return null;

          return (
            <Stack gap={4} key={section.key}>
              <Title order={2} size="h4">
                {t(`details.sections.${section.key}`)}
              </Title>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
                {stats.map(({ stat, value }) => (
                  <Group align="flex-start" gap="xs" key={stat} wrap="nowrap">
                    {vehicleStatIcons[stat] ? (
                      <Image
                        aria-hidden="true"
                        fit="contain"
                        h={20}
                        src={vehicleStatIcons[stat]}
                        w={20}
                      />
                    ) : null}
                    <Stack gap={2}>
                      <Text c="dimmed" size="xs">
                        {t(`stats.${stat}`)}
                      </Text>
                      <Text fw={500} size="sm">
                        {formatVehicleStat(t, i18n.language, stat, value)}
                      </Text>
                    </Stack>
                  </Group>
                ))}
              </SimpleGrid>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

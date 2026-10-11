import {
  Accordion,
  Button,
  Group,
  Paper,
  ScrollArea,
  Text,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { VehicleHierarchyFilter } from "./VehicleHierarchyFilter";
import {
  VehicleLightbarFilter,
  VehicleStatFilters,
} from "./VehicleStatFilters";
import { vehicleNumericStats } from "@/features/vehicles/lib/stats";
import type { VehicleFilterController } from "@/features/vehicles/hooks/useVehicleExplorer";
import classes from "./VehicleFilters.module.css";

interface VehicleFiltersProps {
  filters: VehicleFilterController;
}

export function VehicleFilters({ filters }: VehicleFiltersProps) {
  const { t } = useTranslation(["vehicles", "common"]);

  return (
    <Paper className={classes.root} h="100%" withBorder>
      <Group justify="space-between" gap="xs" px="md" pt="md">
        <Text fw={600}>{t("filters.title")}</Text>
        <Button
          color="gray"
          disabled={!filters.canClear}
          onClick={filters.clear}
          size="compact-xs"
          variant="subtle"
        >
          {t("actions.clear", { ns: "common" })}
        </Button>
      </Group>

      <ScrollArea
        className={classes.scrollArea}
        h={0}
        offsetScrollbars
        type="auto"
      >
        <Accordion
          chevron={<IconChevronRight size={16} aria-hidden="true" />}
          classNames={{ chevron: classes.chevron }}
          defaultValue={["vehicle", "stats"]}
          multiple
          styles={{ content: { paddingTop: 0 } }}
        >
          <Accordion.Item value="vehicle">
            <Accordion.Control>
              {t("filters.sections.vehicle")}
            </Accordion.Control>
            <Accordion.Panel>
              <VehicleHierarchyFilter
                data={filters.hierarchy}
                onChange={filters.changeHierarchy}
                value={filters.selectedHierarchy}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="stats">
            <Accordion.Control>{t("filters.sections.stats")}</Accordion.Control>
            <Accordion.Panel>
              <VehicleStatFilters
                onChange={filters.changeRange}
                ranges={filters.ranges}
                stats={vehicleNumericStats}
                values={filters.rangeFilters}
              />
              {filters.lightbarAvailable ? (
                <VehicleLightbarFilter
                  onChange={filters.changeLightbar}
                  value={filters.lightbarFilter}
                />
              ) : null}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </ScrollArea>
    </Paper>
  );
}

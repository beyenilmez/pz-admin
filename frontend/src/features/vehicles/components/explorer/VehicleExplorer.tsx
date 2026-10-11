import {
  ActionIcon,
  Box,
  CloseButton,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { VehicleFilters } from "./VehicleFilters";
import { VehicleResultsList } from "./VehicleResultsList";
import { vehicleSortFields } from "@/features/vehicles/lib/stats";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
} from "@/features/vehicles/types";
import { useVehicleExplorer } from "@/features/vehicles/hooks/useVehicleExplorer";
import classes from "./VehicleExplorer.module.css";

interface VehicleExplorerProps {
  catalog: VehicleCatalog | null;
  loading?: boolean;
  onVehicleSelect: (vehicle: VehicleCatalogEntry) => void;
}

export function VehicleExplorer({
  catalog,
  loading = false,
  onVehicleSelect,
}: VehicleExplorerProps) {
  const { i18n, t } = useTranslation(["vehicles", "common"]);
  const explorer = useVehicleExplorer(catalog, i18n.language);

  return (
    <Grid
      className={classes.root}
      gap="lg"
      h="100%"
      styles={{ inner: { height: "100%", minHeight: 0 } }}
    >
      <Grid.Col className={classes.column} h="100%" span={{ base: 4, md: 3 }}>
        <VehicleFilters filters={explorer.filters} />
      </Grid.Col>

      <Grid.Col className={classes.column} h="100%" span={{ base: 8, md: 9 }}>
        <Stack className={classes.content} gap="sm" h="100%">
          <Group align="flex-end">
            <TextInput
              aria-label={t("browser.search.label")}
              autoComplete="off"
              disabled={loading}
              flex={1}
              leftSection={<IconSearch size={16} aria-hidden="true" />}
              onChange={(event) => {
                explorer.setSearch(event.currentTarget.value);
              }}
              placeholder={t("search.nameOrId.placeholder", { ns: "common" })}
              ref={explorer.searchInputRef}
              rightSection={
                explorer.search ? (
                  <CloseButton
                    aria-label={t("search.clear", { ns: "common" })}
                    onClick={() => {
                      explorer.setSearch("");
                      explorer.searchInputRef.current?.focus();
                    }}
                    size="sm"
                  />
                ) : null
              }
              value={explorer.search}
            />
            <Select
              aria-label={t("sorting.label", { ns: "common" })}
              data={vehicleSortFields.map((field) => ({
                label:
                  field === "name"
                    ? t("sorting.fields.name")
                    : t(`stats.${field}`),
                value: field,
              }))}
              disabled={loading}
              onChange={explorer.changeSort}
              value={explorer.sortField}
              w={150}
            />
            <Tooltip
              label={t(`sorting.directions.${explorer.sortDirection}`, {
                ns: "common",
              })}
              withArrow
            >
              <ActionIcon
                aria-label={t("sorting.actions.changeDirection", {
                  direction: t(`sorting.directions.${explorer.sortDirection}`, {
                    ns: "common",
                  }),
                  ns: "common",
                })}
                disabled={loading}
                onClick={() =>
                  explorer.setSortDirection((current) =>
                    current === "ascending" ? "descending" : "ascending",
                  )
                }
                size={36}
                variant="default"
              >
                {explorer.sortDirection === "ascending" ? (
                  <IconArrowUp size={16} aria-hidden="true" />
                ) : (
                  <IconArrowDown size={16} aria-hidden="true" />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>

          <Text
            c="dimmed"
            className={classes.resultCount}
            data-updating={explorer.updating || undefined}
            size="sm"
          >
            {t("browser.results.summary", {
              count: explorer.vehicles.length,
            })}
          </Text>

          <Box
            aria-busy={explorer.updating}
            className={classes.results}
            data-updating={explorer.updating || undefined}
          >
            <VehicleResultsList
              loading={loading}
              onVehicleSelect={onVehicleSelect}
              vehicles={explorer.vehicles}
            />
          </Box>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}

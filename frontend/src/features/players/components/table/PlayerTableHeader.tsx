import { Checkbox, Group, Table, Text, UnstyledButton } from "@mantine/core";
import {
  IconArrowsSort,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { PlayerSorting, SortColumn } from "../../lib/table";

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  onSort: (column: SortColumn) => void;
  sorting: PlayerSorting;
  width?: number | string;
}

function SortableHeader({
  column,
  label,
  onSort,
  sorting,
  width,
}: SortableHeaderProps) {
  const active = sorting.column === column;
  const Icon = active
    ? sorting.direction === "asc"
      ? IconChevronUp
      : IconChevronDown
    : IconArrowsSort;

  return (
    <Table.Th
      w={width}
      aria-sort={
        active
          ? sorting.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <UnstyledButton w="100%" py="xs" onClick={() => onSort(column)}>
        <Group gap="xs" wrap="nowrap">
          <Text fw={600} size="xs">
            {label}
          </Text>
          <Icon
            aria-hidden="true"
            color="var(--mantine-color-dimmed)"
            size={14}
          />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

interface PlayerTableHeaderProps {
  allVisibleSelected: boolean;
  hasVisiblePlayers: boolean;
  onSelectAll: () => void;
  onSort: (column: SortColumn) => void;
  selectedVisibleCount: number;
  sorting: PlayerSorting;
}

export function PlayerTableHeader({
  allVisibleSelected,
  hasVisiblePlayers,
  onSelectAll,
  onSort,
  selectedVisibleCount,
  sorting,
}: PlayerTableHeaderProps) {
  const { t } = useTranslation("players");

  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th w={44}>
          <Checkbox
            aria-label={t("selection.selectAll")}
            checked={allVisibleSelected}
            disabled={!hasVisiblePlayers}
            indeterminate={selectedVisibleCount > 0 && !allVisibleSelected}
            onChange={onSelectAll}
          />
        </Table.Th>
        <SortableHeader
          column="username"
          label={t("table.columns.player")}
          onSort={onSort}
          sorting={sorting}
          width="34%"
        />
        <SortableHeader
          column="lastSeen"
          label={t("table.columns.lastSeen")}
          onSort={onSort}
          sorting={sorting}
          width="34%"
        />
        <SortableHeader
          column="accessLevel"
          label={t("table.columns.role")}
          onSort={onSort}
          sorting={sorting}
          width="22%"
        />
        <Table.Th w={44} aria-label={t("actions.label", { ns: "common" })} />
      </Table.Tr>
    </Table.Thead>
  );
}

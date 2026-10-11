import { useMemo, useRef, useState } from "react";
import {
  Anchor,
  Button,
  CloseButton,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import {
  filterAndSortPlayers,
  type PlayerSorting,
  type SortColumn,
} from "../../lib/table";
import { usePlayerActions } from "../../actions/PlayerActionsProvider";
import { PlayerTableHeader } from "./PlayerTableHeader";
import { PlayerTableRow } from "./PlayerTableRow";

interface PlayerTableProps {
  loading: boolean;
  onSelectionChange: (playerIds: Set<string>) => void;
  players: Player[];
  selectedPlayerIds: ReadonlySet<string>;
  showEmptyState: boolean;
}

export function PlayerTable({
  loading,
  onSelectionChange,
  players,
  selectedPlayerIds,
  showEmptyState,
}: PlayerTableProps) {
  const { i18n, t } = useTranslation(["players", "common"]);
  const language = i18n.language;
  const actions = usePlayerActions();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skeleton = useSkeletonVisibility(loading && players.length === 0);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<PlayerSorting>({
    column: "lastSeen",
    direction: "desc",
  });
  const relativeTime = useMemo(
    () =>
      new Intl.RelativeTimeFormat(language, {
        numeric: "auto",
        style: "narrow",
      }),
    [language],
  );
  const visiblePlayers = useMemo(
    () => filterAndSortPlayers(players, search, language, sorting),
    [language, players, search, sorting],
  );
  const visiblePlayerIds = visiblePlayers.map((player) => player.id);
  const selectedVisibleCount = visiblePlayerIds.filter((playerId) =>
    selectedPlayerIds.has(playerId),
  ).length;
  const allVisibleSelected =
    visiblePlayerIds.length > 0 &&
    selectedVisibleCount === visiblePlayerIds.length;

  function handleSort(column: SortColumn) {
    setSorting((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }

  function toggleVisiblePlayers() {
    const next = new Set(selectedPlayerIds);
    if (allVisibleSelected) {
      visiblePlayerIds.forEach((playerId) => next.delete(playerId));
    } else {
      visiblePlayerIds.forEach((playerId) => next.add(playerId));
    }
    onSelectionChange(next);
  }

  function togglePlayer(playerId: string) {
    const next = new Set(selectedPlayerIds);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.add(playerId);
    }
    onSelectionChange(next);
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          aria-label={t("table.search.label")}
          autoComplete="off"
          leftSection={<IconSearch size={16} aria-hidden="true" />}
          maw={360}
          name="player-search"
          placeholder={t("table.search.placeholder")}
          ref={searchInputRef}
          rightSection={
            search ? (
              <CloseButton
                aria-label={t("search.clear", { ns: "common" })}
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                size="sm"
              />
            ) : null
          }
          spellCheck={false}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Button onClick={actions.openAddServerUser}>
          {t("table.actions.addPlayer")}
        </Button>
      </Group>

      <Paper withBorder style={{ overflow: "hidden" }}>
        <Table.ScrollContainer minWidth={680} type="native">
          <Table
            aria-label={t("table.label")}
            highlightOnHover
            layout="fixed"
            stickyHeader
            styles={{
              td: { userSelect: "none", WebkitUserSelect: "none" },
              th: { userSelect: "none", WebkitUserSelect: "none" },
            }}
          >
            <PlayerTableHeader
              allVisibleSelected={allVisibleSelected}
              hasVisiblePlayers={visiblePlayers.length > 0}
              onSelectAll={toggleVisiblePlayers}
              onSort={handleSort}
              selectedVisibleCount={selectedVisibleCount}
              sorting={sorting}
            />
            <Table.Tbody>
              {skeleton.visible
                ? Array.from({ length: 5 }, (_, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Skeleton h={20} w={20} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={20} w="60%" />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={20} w={120} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={20} w={80} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={28} w={28} />
                      </Table.Td>
                    </Table.Tr>
                  ))
                : skeleton.active
                  ? null
                  : visiblePlayers.map((player) => (
                      <PlayerTableRow
                        key={player.id}
                        checked={selectedPlayerIds.has(player.id)}
                        onToggle={() => togglePlayer(player.id)}
                        player={player}
                        relativeTime={relativeTime}
                      />
                    ))}

              {!loading && showEmptyState && visiblePlayers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" py="xl">
                      {players.length === 0
                        ? t("table.empty.default")
                        : t("table.empty.search")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Anchor
        component="button"
        size="sm"
        ta="center"
        onClick={actions.openAddLocalPlayer}
      >
        {t("table.actions.addLocalPlayer")}
      </Anchor>
    </Stack>
  );
}

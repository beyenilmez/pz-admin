import { useState } from "react";
import { Alert, Box, Button, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/PageContainer";
import { usePlayers } from "../PlayersProvider";
import { PlayerBulkActions } from "../actions/menu/PlayerBulkActions";
import { PlayerTable } from "./table/PlayerTable";

export function PlayersWorkspace() {
  const { t } = useTranslation(["players", "common"]);
  const { error, loading, players, refresh } = usePlayers();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const selectedPlayers = players.filter((player) =>
    selectedPlayerIds.has(player.id),
  );
  const hasSelection = selectedPlayers.length > 0;

  return (
    <PageContainer
      contentWidth="wide"
      h="100%"
      pos="relative"
      px={0}
      style={{ overflow: "hidden" }}
    >
      <Stack
        gap="md"
        h="100%"
        px="xl"
        py="md"
        pb={hasSelection ? 88 : "md"}
        aria-busy={loading}
        style={{ overflowY: "auto" }}
      >
        {error ? (
          <Alert
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={t("errors.load.title")}
            aria-live="polite"
          >
            <Stack gap="xs" align="flex-start">
              <Text size="sm">{error}</Text>
              <Button variant="light" size="xs" onClick={() => void refresh()}>
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <PlayerTable
          loading={loading}
          onSelectionChange={setSelectedPlayerIds}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          showEmptyState={!error}
        />
      </Stack>

      {hasSelection ? (
        <Box
          bottom="var(--mantine-spacing-md)"
          left="var(--mantine-spacing-md)"
          pos="absolute"
          right="var(--mantine-spacing-md)"
          style={{
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <PlayerBulkActions
            onClear={() => setSelectedPlayerIds(new Set())}
            players={selectedPlayers}
          />
        </Box>
      ) : null}
    </PageContainer>
  );
}

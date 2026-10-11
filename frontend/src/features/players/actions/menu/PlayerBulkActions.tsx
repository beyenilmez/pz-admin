import { ActionIcon, Button, Group, Menu, Paper, Text } from "@mantine/core";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { isOnline } from "../../status";
import { usePlayerActions } from "../PlayerActionsProvider";
import { PlayerEventMenuItems } from "../events/PlayerEventMenuItems";
import { PlayerGiveMenuItems } from "../give/PlayerGiveMenuItems";
import { PlayerModerationMenuItems } from "../moderation/PlayerModerationMenuItems";
import { BulkPlayerPowerMenuItems } from "../powers/PlayerPowerMenuItems";

interface PlayerBulkActionsProps {
  onClear: () => void;
  players: Player[];
}

export function PlayerBulkActions({
  onClear,
  players,
}: PlayerBulkActionsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();
  const allOnline = players.every(isOnline);

  return (
    <Paper
      component={Group}
      aria-label={t("actions.bulk.label")}
      gap="sm"
      maw="100%"
      px="md"
      py="xs"
      radius="md"
      role="toolbar"
      shadow="md"
      style={{ pointerEvents: "auto", width: "fit-content" }}
      withBorder
      wrap="nowrap"
    >
      <Text
        aria-live="polite"
        fw={600}
        size="sm"
        style={{ whiteSpace: "nowrap" }}
      >
        {t("selection.summary", { count: players.length })}
      </Text>

      <Menu position="top" withinPortal>
        <Menu.Target>
          <Button
            rightSection={<IconChevronDown size={14} aria-hidden="true" />}
            size="xs"
            variant="default"
          >
            {t("actions.label", { ns: "common" })}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          {allOnline ? (
            <Menu.Item onClick={() => actions.openTeleport(players)}>
              {t("actions.commands.teleport")}
            </Menu.Item>
          ) : null}

          {allOnline ? (
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.moderation")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerModerationMenuItems mode="bulk" players={players} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          ) : (
            <PlayerModerationMenuItems mode="bulk" players={players} />
          )}

          {allOnline ? (
            <>
              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{t("actions.groups.powers")}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  <BulkPlayerPowerMenuItems players={players} />
                </Menu.Sub.Dropdown>
              </Menu.Sub>

              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{t("actions.groups.give")}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  <PlayerGiveMenuItems players={players} />
                </Menu.Sub.Dropdown>
              </Menu.Sub>

              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{t("actions.groups.events")}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  <PlayerEventMenuItems players={players} />
                </Menu.Sub.Dropdown>
              </Menu.Sub>
            </>
          ) : null}
        </Menu.Dropdown>
      </Menu>

      <ActionIcon
        aria-label={t("selection.clear")}
        color="gray"
        onClick={onClear}
        size="sm"
        variant="subtle"
      >
        <IconX size={16} aria-hidden="true" />
      </ActionIcon>
    </Paper>
  );
}

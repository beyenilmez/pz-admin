import { ActionIcon, Menu } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { isOnline } from "../../status";
import { usePlayerActions } from "../PlayerActionsProvider";
import { PlayerEventMenuItems } from "../events/PlayerEventMenuItems";
import { PlayerGiveMenuItems } from "../give/PlayerGiveMenuItems";
import { PlayerModerationMenuItems } from "../moderation/PlayerModerationMenuItems";
import { PlayerPowerMenuItems } from "../powers/PlayerPowerMenuItems";

interface PlayerActionsMenuProps {
  player: Player;
}

export function PlayerActionsMenu({ player }: PlayerActionsMenuProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();
  const online = isOnline(player);

  return (
    <Menu
      position="bottom-end"
      styles={{
        item: {
          padding:
            "calc(var(--mantine-spacing-xs) / 2) var(--mantine-spacing-xs)",
        },
      }}
      withinPortal
    >
      <Menu.Target>
        <ActionIcon
          aria-label={t("actions.menu.label", {
            username: player.username,
          })}
          color="gray"
          radius="sm"
          size="sm"
          variant="subtle"
        >
          <IconDots size={18} aria-hidden="true" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {online ? (
          <Menu.Item onClick={() => actions.openTeleport([player])}>
            {t("actions.commands.teleport")}
          </Menu.Item>
        ) : null}

        {online ? (
          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item>{t("actions.groups.moderation")}</Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <PlayerModerationMenuItems mode="single" players={[player]} />
            </Menu.Sub.Dropdown>
          </Menu.Sub>
        ) : (
          <PlayerModerationMenuItems mode="single" players={[player]} />
        )}

        {online ? (
          <>
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.powers")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerPowerMenuItems player={player} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.give")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerGiveMenuItems players={[player]} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.events")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerEventMenuItems players={[player]} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}

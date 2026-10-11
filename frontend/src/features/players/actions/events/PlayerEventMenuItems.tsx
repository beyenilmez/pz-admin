import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { usePlayerActions } from "../PlayerActionsProvider";

interface PlayerEventMenuItemsProps {
  players: Player[];
}

export function PlayerEventMenuItems({ players }: PlayerEventMenuItemsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();

  return (
    <>
      <Menu.Item onClick={() => actions.openCreateHorde(players)}>
        {t("actions.commands.createHorde")}
      </Menu.Item>
      <Menu.Item onClick={() => actions.openLightning(players)}>
        {t("actions.commands.lightningStrike")}
      </Menu.Item>
      <Menu.Item onClick={() => actions.openThunder(players)}>
        {t("actions.commands.thunderStrike")}
      </Menu.Item>
    </>
  );
}

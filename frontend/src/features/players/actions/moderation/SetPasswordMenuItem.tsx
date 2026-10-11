import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ID as FeatureID } from "@bindings/internal/feature/models";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/SessionProvider";
import { usePlayerActions } from "../PlayerActionsProvider";

export function SetPasswordMenuItem({ players }: { players: Player[] }) {
  const { t } = useTranslation("players");
  const { supports } = useSession();
  const actions = usePlayerActions();

  if (!supports(FeatureID.PlayerSetPassword)) return null;

  return (
    <Menu.Item onClick={() => actions.openSetPassword(players)}>
      {t("actions.commands.setPassword")}
    </Menu.Item>
  );
}

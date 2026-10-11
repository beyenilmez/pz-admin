import { Fragment } from "react";
import { Menu, VisuallyHidden } from "@mantine/core";
import { IconCheck, IconQuestionMark, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/SessionProvider";
import { playerPowers } from "./definitions";

function useAvailablePlayerPowers() {
  const { supports } = useSession();
  return playerPowers.filter(
    (definition) => !definition.feature || supports(definition.feature),
  );
}

function PowerStateIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <IconCheck size={14} aria-hidden="true" />;
  if (value === false) return <IconX size={14} aria-hidden="true" />;
  return <IconQuestionMark size={14} aria-hidden="true" />;
}

function stateLabel(value: boolean | null | undefined) {
  if (value === true) return "actions.powers.states.enabled";
  if (value === false) return "actions.powers.states.disabled";
  return "actions.powers.states.unknown";
}

export function PlayerPowerMenuItems({ player }: { player: Player }) {
  const { t } = useTranslation("players");
  const availablePowers = useAvailablePlayerPowers();

  return availablePowers.map((definition) => {
    const value = definition.value(player);
    return (
      <Menu.Item
        key={definition.label}
        onClick={() => void definition.execute([player], value !== true)}
        rightSection={<PowerStateIcon value={value} />}
      >
        {t(definition.label)}
        <VisuallyHidden> {t(stateLabel(value))}</VisuallyHidden>
      </Menu.Item>
    );
  });
}

export function BulkPlayerPowerMenuItems({ players }: { players: Player[] }) {
  const { t } = useTranslation("players");
  const availablePowers = useAvailablePlayerPowers();

  return availablePowers.map((definition) => (
    <Fragment key={definition.label}>
      <Menu.Item onClick={() => void definition.execute(players, true)}>
        {t(definition.enableLabel)}
      </Menu.Item>
      <Menu.Item onClick={() => void definition.execute(players, false)}>
        {t(definition.disableLabel)}
      </Menu.Item>
    </Fragment>
  ));
}

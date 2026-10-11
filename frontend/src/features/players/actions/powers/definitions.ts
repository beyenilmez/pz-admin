import { ID as FeatureID } from "@bindings/internal/feature/models";
import type { Player } from "@bindings/internal/player/models";
import { setGodMode, setInvisible, setNoClip } from "./actions";

const playerPowerById = {
  invisible: {
    feature: FeatureID.PlayerSetInvisible,
    label: "actions.powers.invisible.label",
    enableLabel: "actions.powers.invisible.enable",
    disableLabel: "actions.powers.invisible.disable",
    value: (player: Player) => player.invisible,
    execute: setInvisible,
  },
  godMode: {
    feature: null,
    label: "actions.powers.godMode.label",
    enableLabel: "actions.powers.godMode.enable",
    disableLabel: "actions.powers.godMode.disable",
    value: (player: Player) => player.godMode,
    execute: setGodMode,
  },
  noClip: {
    feature: FeatureID.PlayerSetNoClip,
    label: "actions.powers.noClip.label",
    enableLabel: "actions.powers.noClip.enable",
    disableLabel: "actions.powers.noClip.disable",
    value: (player: Player) => player.noClip,
    execute: setNoClip,
  },
} as const;

export type PlayerPowerDefinition =
  (typeof playerPowerById)[keyof typeof playerPowerById];

// Object insertion order is the intended menu order.
export const playerPowers: readonly PlayerPowerDefinition[] =
  Object.values(playerPowerById);

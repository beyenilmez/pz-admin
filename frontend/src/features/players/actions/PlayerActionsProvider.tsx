import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { useSession } from "@/features/session/SessionProvider";
import { usePlayers } from "../PlayersProvider";
import { AddLocalPlayerModal } from "./creation/AddLocalPlayerModal";
import { AddServerUserModal } from "./creation/AddServerUserModal";
import { addLocalPlayer, addServerUser } from "./creation/actions";
import { CreateHordeModal } from "./events/CreateHordeModal";
import { LightningPlayerModal } from "./events/LightningPlayerModal";
import { ThunderPlayerModal } from "./events/ThunderPlayerModal";
import { createHorde, lightning, thunder } from "./events/actions";
import { AddXpModal } from "./give/AddXpModal";
import { GiveItemsModal } from "./give/GiveItemsModal";
import { SpawnVehicleModal } from "./give/SpawnVehicleModal";
import { addXp, giveItems, spawnVehicle } from "./give/actions";
import { BanPlayerModal } from "./moderation/BanPlayerModal";
import { KickPlayerModal } from "./moderation/KickPlayerModal";
import { RemoveFromWhitelistModal } from "./moderation/RemoveFromWhitelistModal";
import { SetAccessLevelModal } from "./moderation/SetAccessLevelModal";
import { SetPasswordModal } from "./moderation/SetPasswordModal";
import {
  ban,
  kick,
  removeFromWhitelist,
  setAccessLevel,
  setPassword,
  setVoiceBanned,
  unban,
} from "./moderation/actions";
import { TeleportPlayerModal } from "./teleport/TeleportPlayerModal";
import { teleportToCoordinates, teleportToPlayer } from "./teleport/actions";

type DialogType =
  | "accessLevel"
  | "addLocalPlayer"
  | "addServerUser"
  | "addXp"
  | "ban"
  | "createHorde"
  | "giveItems"
  | "kick"
  | "lightning"
  | "removeFromWhitelist"
  | "setPassword"
  | "spawnVehicle"
  | "teleport"
  | "thunder";

interface PlayerDialogState {
  opened: boolean;
  players: Player[];
  type: DialogType | null;
}

interface PlayerActions {
  openAccessLevel: (players: Player[]) => void;
  openAddLocalPlayer: () => void;
  openAddServerUser: () => void;
  openAddXp: (players: Player[]) => void;
  openBan: (players: Player[]) => void;
  openCreateHorde: (players: Player[]) => void;
  openGiveItems: (players: Player[]) => void;
  openKick: (players: Player[]) => void;
  openLightning: (players: Player[]) => void;
  openRemoveFromWhitelist: (players: Player[]) => void;
  openSetPassword: (players: Player[]) => void;
  openSpawnVehicle: (players: Player[]) => void;
  openTeleport: (players: Player[]) => void;
  openThunder: (players: Player[]) => void;
  setVoiceBanned: (players: Player[], banned: boolean) => void;
  unban: (players: Player[]) => void;
}

const PlayerActionsContext = createContext<PlayerActions | null>(null);

const initialDialog: PlayerDialogState = {
  opened: false,
  players: [],
  type: null,
};

interface PlayerActionsProviderProps {
  children: ReactNode;
}

export function PlayerActionsProvider({
  children,
}: PlayerActionsProviderProps) {
  const { players } = usePlayers();
  const { profile } = useSession();
  const [dialog, setDialog] = useState<PlayerDialogState>(initialDialog);
  const build: GameBuild = profile?.version === "41" ? "41" : "42";

  const openDialog = useCallback((type: DialogType, targets: Player[] = []) => {
    setDialog({ opened: true, players: targets, type });
  }, []);

  const closeDialog = useCallback(() => {
    // Retain the dialog contents while its exit transition finishes.
    setDialog((current) => ({ ...current, opened: false }));
  }, []);

  const actions = useMemo<PlayerActions>(
    () => ({
      openAccessLevel: (targets) => openDialog("accessLevel", targets),
      openAddLocalPlayer: () => openDialog("addLocalPlayer"),
      openAddServerUser: () => openDialog("addServerUser"),
      openAddXp: (targets) => openDialog("addXp", targets),
      openBan: (targets) => openDialog("ban", targets),
      openCreateHorde: (targets) => openDialog("createHorde", targets),
      openGiveItems: (targets) => openDialog("giveItems", targets),
      openKick: (targets) => openDialog("kick", targets),
      openLightning: (targets) => openDialog("lightning", targets),
      openRemoveFromWhitelist: (targets) =>
        openDialog("removeFromWhitelist", targets),
      openSetPassword: (targets) => openDialog("setPassword", targets),
      openSpawnVehicle: (targets) => openDialog("spawnVehicle", targets),
      openTeleport: (targets) => openDialog("teleport", targets),
      openThunder: (targets) => openDialog("thunder", targets),
      setVoiceBanned: (targets, banned) => void setVoiceBanned(targets, banned),
      unban: (targets) => void unban(targets),
    }),
    [openDialog],
  );

  return (
    <PlayerActionsContext value={actions}>
      {children}

      <SetAccessLevelModal
        build={build}
        opened={dialog.opened && dialog.type === "accessLevel"}
        players={dialog.players}
        onClose={closeDialog}
        onSetAccessLevel={setAccessLevel}
      />
      <SetPasswordModal
        opened={dialog.opened && dialog.type === "setPassword"}
        players={dialog.players}
        onClose={closeDialog}
        onSetPassword={setPassword}
      />
      <AddServerUserModal
        opened={dialog.opened && dialog.type === "addServerUser"}
        onAdd={addServerUser}
        onClose={closeDialog}
      />
      <AddLocalPlayerModal
        opened={dialog.opened && dialog.type === "addLocalPlayer"}
        onAdd={addLocalPlayer}
        onClose={closeDialog}
      />
      <BanPlayerModal
        opened={dialog.opened && dialog.type === "ban"}
        players={dialog.players}
        onBan={ban}
        onClose={closeDialog}
      />
      <KickPlayerModal
        opened={dialog.opened && dialog.type === "kick"}
        players={dialog.players}
        onClose={closeDialog}
        onKick={kick}
      />
      <RemoveFromWhitelistModal
        opened={dialog.opened && dialog.type === "removeFromWhitelist"}
        players={dialog.players}
        onClose={closeDialog}
        onRemove={removeFromWhitelist}
      />
      <TeleportPlayerModal
        allPlayers={players}
        opened={dialog.opened && dialog.type === "teleport"}
        players={dialog.players}
        onClose={closeDialog}
        onTeleportToCoordinates={teleportToCoordinates}
        onTeleportToPlayer={teleportToPlayer}
      />

      {dialog.type === "spawnVehicle" && dialog.players.length > 0 ? (
        <SpawnVehicleModal
          build={build}
          onSpawn={spawnVehicle}
          onClose={closeDialog}
          opened={dialog.opened}
          players={dialog.players}
        />
      ) : null}
      {dialog.type === "giveItems" && dialog.players.length > 0 ? (
        <GiveItemsModal
          build={build}
          onClose={closeDialog}
          onGive={giveItems}
          opened={dialog.opened}
          players={dialog.players}
        />
      ) : null}
      {dialog.type === "addXp" && dialog.players.length > 0 ? (
        <AddXpModal
          build={build}
          onAdd={addXp}
          onClose={closeDialog}
          opened={dialog.opened}
          players={dialog.players}
        />
      ) : null}

      <CreateHordeModal
        opened={dialog.opened && dialog.type === "createHorde"}
        players={dialog.players}
        onClose={closeDialog}
        onCreate={createHorde}
      />
      <LightningPlayerModal
        opened={dialog.opened && dialog.type === "lightning"}
        players={dialog.players}
        onClose={closeDialog}
        onLightning={lightning}
      />
      <ThunderPlayerModal
        opened={dialog.opened && dialog.type === "thunder"}
        players={dialog.players}
        onClose={closeDialog}
        onThunder={thunder}
      />
    </PlayerActionsContext>
  );
}

export function usePlayerActions() {
  const actions = useContext(PlayerActionsContext);
  if (!actions) {
    throw new Error(
      "usePlayerActions must be used within PlayerActionsProvider",
    );
  }
  return actions;
}

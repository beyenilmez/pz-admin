import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "@bindings/internal/player/models";
import i18n from "@/i18n";
import { fireEvent, render, screen, waitFor } from "@/test/render";
import { TeleportPlayerModal } from "./TeleportPlayerModal";

vi.mock("@/features/session/SessionProvider", () => ({
  useSession: () => ({ profile: { version: "42" } }),
}));

const earlier = new Date("2026-01-01T00:00:00.000Z");
const later = new Date("2026-01-02T00:00:00.000Z");

function onlinePlayer(id: string, username: string) {
  return new Player({
    id,
    lastKnownOfflineAt: earlier,
    lastSeenOnlineAt: later,
    username,
  });
}

function offlinePlayer(id: string, username: string) {
  return new Player({
    id,
    lastKnownOfflineAt: later,
    lastSeenOnlineAt: earlier,
    username,
  });
}

const targets = [
  onlinePlayer("source-bravo", "Bravo Source"),
  onlinePlayer("source-alpha", "Alpha Source"),
];
const alphaDestination = onlinePlayer("destination-alpha", "Alpha Destination");
const zuluDestination = onlinePlayer("destination-zulu", "Zulu Destination");
const unavailableDestination = offlinePlayer(
  "destination-offline",
  "Offline Destination",
);
const neverSeenDestination = new Player({
  id: "destination-never-seen",
  username: "Never Seen Destination",
});
const allPlayers = [
  zuluDestination,
  targets[0],
  unavailableDestination,
  alphaDestination,
  neverSeenDestination,
  targets[1],
];

const labels = {
  cancel: i18n.t("actions.cancel", { ns: "common" }),
  coordinatesMode: i18n.t("dialogs.teleport.mode.options.coordinates", {
    ns: "players",
  }),
  destinationPlayer: i18n.t("dialogs.teleport.destinationPlayer.label", {
    ns: "players",
  }),
  playerMode: i18n.t("dialogs.teleport.mode.options.player", {
    ns: "players",
  }),
  submit: i18n.t("dialogs.teleport.submit", { ns: "players" }),
  x: i18n.t("dialogs.teleport.coordinates.x.label", { ns: "players" }),
  y: i18n.t("dialogs.teleport.coordinates.y.label", { ns: "players" }),
  z: i18n.t("dialogs.teleport.coordinates.z.label", { ns: "players" }),
};

function coordinateInput(axis: "x" | "y" | "z") {
  return screen.getByLabelText(labels[axis], {
    exact: false,
    selector: `input[name="${axis}"]`,
  });
}

function submitButton() {
  return screen.getByRole("button", {
    name: labels.submit,
  });
}

interface HarnessProps {
  onClose: () => void;
  onTeleportToCoordinates: (
    players: Player[],
    coordinates: string,
  ) => Promise<boolean>;
  onTeleportToPlayer: (
    players: Player[],
    targetPlayerId: string,
  ) => Promise<boolean>;
}

function TeleportHarness({
  onClose,
  onTeleportToCoordinates,
  onTeleportToPlayer,
}: HarnessProps) {
  const [opened, setOpened] = useState(true);
  return (
    <TeleportPlayerModal
      allPlayers={allPlayers}
      onClose={() => {
        onClose();
        setOpened(false);
      }}
      onTeleportToCoordinates={onTeleportToCoordinates}
      onTeleportToPlayer={onTeleportToPlayer}
      opened={opened}
      players={targets}
    />
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("TeleportPlayerModal", () => {
  it("forwards ordered targets and exact coordinates", async () => {
    const onClose = vi.fn();
    const onTeleportToCoordinates = vi
      .fn<HarnessProps["onTeleportToCoordinates"]>()
      .mockResolvedValue(false);
    const onTeleportToPlayer = vi.fn<HarnessProps["onTeleportToPlayer"]>();
    render(
      <TeleportPlayerModal
        allPlayers={allPlayers}
        onClose={onClose}
        onTeleportToCoordinates={onTeleportToCoordinates}
        onTeleportToPlayer={onTeleportToPlayer}
        opened
        players={targets}
      />,
    );

    const xInput = coordinateInput("x");
    const yInput = coordinateInput("y");
    const zInput = coordinateInput("z");
    fireEvent.change(xInput, { target: { value: "12.5" } });
    fireEvent.change(yInput, { target: { value: "-8" } });
    fireEvent.change(zInput, { target: { value: "3" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onTeleportToCoordinates).toHaveBeenCalledOnce());
    const [calledTargets, coordinates] =
      onTeleportToCoordinates.mock.calls[0] ?? [];
    expect(calledTargets?.map((player) => player.id)).toEqual([
      "source-bravo",
      "source-alpha",
    ]);
    expect(coordinates).toBe("12.5,-8,3");
    expect(onTeleportToPlayer).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("offers only eligible destinations and dispatches the selected player ID", async () => {
    const onClose = vi.fn();
    const onTeleportToCoordinates =
      vi.fn<HarnessProps["onTeleportToCoordinates"]>();
    const onTeleportToPlayer = vi
      .fn<HarnessProps["onTeleportToPlayer"]>()
      .mockResolvedValue(true);
    render(
      <TeleportHarness
        onClose={onClose}
        onTeleportToCoordinates={onTeleportToCoordinates}
        onTeleportToPlayer={onTeleportToPlayer}
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", {
        name: labels.playerMode,
      }),
    );
    const destinationInput = screen.getByRole("combobox", {
      name: labels.destinationPlayer,
    });
    fireEvent.click(destinationInput);

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      alphaDestination.username,
      zuluDestination.username,
    ]);
    fireEvent.click(
      screen.getByRole("option", { name: zuluDestination.username }),
    );
    fireEvent.click(submitButton());

    await waitFor(() => expect(onTeleportToPlayer).toHaveBeenCalledOnce());
    const [calledTargets, targetPlayerId] =
      onTeleportToPlayer.mock.calls[0] ?? [];
    expect(calledTargets?.map((player) => player.id)).toEqual([
      "source-bravo",
      "source-alpha",
    ]);
    expect(targetPlayerId).toBe(zuluDestination.id);
    expect(onTeleportToCoordinates).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "@bindings/internal/player/models";
import i18n from "@/i18n";
import { fireEvent, render, screen, waitFor } from "@/test/render";
import { SetAccessLevelModal } from "./SetAccessLevelModal";

const labels = {
  cancel: i18n.t("actions.cancel", { ns: "common" }),
  overseer: i18n.t("roles.overseer", { ns: "players" }),
  priority: i18n.t("roles.priority", { ns: "players" }),
  submit: i18n.t("dialogs.setRole.submit", { ns: "players" }),
};

function player(id: string, username: string, accessLevel: string) {
  return new Player({ accessLevel, id, username });
}

const mixedTargets = [
  player("target-zulu", "Zulu", "admin"),
  player("target-alpha", "Alpha", "observer"),
];
const priorityTargets = [
  player("target-bravo", "Bravo", "PRIORITY"),
  player("target-alpha", "Alpha", "priority"),
];

type SetAccessLevel = (
  players: Player[],
  accessLevel: string,
) => Promise<boolean>;

interface HarnessProps {
  onClose: () => void;
  onSetAccessLevel: SetAccessLevel;
}

function Build42Harness({ onClose, onSetAccessLevel }: HarnessProps) {
  const [opened, setOpened] = useState(true);
  return (
    <SetAccessLevelModal
      build="42"
      onClose={() => {
        onClose();
        setOpened(false);
      }}
      onSetAccessLevel={onSetAccessLevel}
      opened={opened}
      players={priorityTargets}
    />
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("SetAccessLevelModal", () => {
  it("offers Build 41 roles and forwards the selected role", async () => {
    const onClose = vi.fn();
    const onSetAccessLevel = vi.fn<SetAccessLevel>().mockResolvedValue(false);
    render(
      <SetAccessLevelModal
        build="41"
        onClose={onClose}
        onSetAccessLevel={onSetAccessLevel}
        opened
        players={mixedTargets}
      />,
    );

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(screen.getByRole("button", { name: labels.submit })).toBeDisabled();
    expect(screen.getByRole("radio", { name: labels.overseer })).toBeVisible();
    expect(
      screen.queryByRole("radio", { name: labels.priority }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: labels.overseer }));
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(onSetAccessLevel).toHaveBeenCalledOnce());
    const [calledTargets, accessLevel] = onSetAccessLevel.mock.calls[0] ?? [];
    expect(calledTargets?.map((target) => target.id)).toEqual([
      "target-zulu",
      "target-alpha",
    ]);
    expect(accessLevel).toBe("overseer");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses a shared supported Build 42 role and closes after success", async () => {
    const onClose = vi.fn();
    const onSetAccessLevel = vi.fn<SetAccessLevel>().mockResolvedValue(true);
    render(
      <Build42Harness onClose={onClose} onSetAccessLevel={onSetAccessLevel} />,
    );

    expect(screen.getByRole("radio", { name: labels.priority })).toBeChecked();
    expect(
      screen.queryByRole("radio", { name: labels.overseer }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.submit })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(onSetAccessLevel).toHaveBeenCalledOnce());
    const [calledTargets, accessLevel] = onSetAccessLevel.mock.calls[0] ?? [];
    expect(calledTargets?.map((target) => target.id)).toEqual([
      "target-bravo",
      "target-alpha",
    ]);
    expect(accessLevel).toBe("priority");
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

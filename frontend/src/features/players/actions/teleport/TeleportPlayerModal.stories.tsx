import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import { TeleportPlayerModal } from "./TeleportPlayerModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/TeleportPlayerModal",
  component: TeleportPlayerModal,
  args: {
    opened: true,
    onClose: fn(),
    onTeleportToCoordinates: fn(async () => true),
    onTeleportToPlayer: fn(async () => true),
    players: makePlayers("sawyer"),
    allPlayers: makePlayers(),
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.teleport.title", { count: args.players.length })}
        </Button>
        <TeleportPlayerModal
          {...args}
          opened={opened}
          onClose={() => {
            args.onClose();
            updateArgs({ opened: false });
          }}
        />
      </>
    );
  },
} satisfies Meta<typeof TeleportPlayerModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SinglePlayer: Story = {};
export const MultiplePlayers: Story = {
  args: { players: makePlayers("sawyer", "hurley") },
};

export const ToPlayer: Story = {
  play: async ({ args, canvasElement }) => {
    // Storybook preserves edited args when revisiting a story.
    if (!args.opened) {
      await userEvent.click(
        within(canvasElement).getByRole("button", {
          name: i18n.t("dialogs.teleport.title", {
            ns: "players",
            count: args.players.length,
          }),
        }),
      );
    }
    const dialog = within(await within(document.body).findByRole("dialog"));
    await userEvent.click(
      dialog.getByRole("radio", {
        name: i18n.t("dialogs.teleport.mode.options.player", { ns: "players" }),
      }),
    );
    await waitFor(async () => {
      await expect(
        dialog.findByRole("combobox", {
          name: (name) =>
            name.startsWith(
              i18n.t("dialogs.teleport.destinationPlayer.label", {
                ns: "players",
              }),
            ),
        }),
      ).resolves.toBeVisible();
    });
  },
};
export const NoDestinationPlayers: Story = {
  args: { allPlayers: makePlayers("sawyer") },
  play: async (context) => {
    await ToPlayer.play?.(context);
    const dialog = within(await within(document.body).findByRole("dialog"));
    await userEvent.click(dialog.getByRole("combobox"));
    await waitFor(async () => {
      await expect(
        within(document.body).findByText(
          i18n.t("dialogs.teleport.destinationPlayer.empty", { ns: "players" }),
        ),
      ).resolves.toBeVisible();
    });
  },
};

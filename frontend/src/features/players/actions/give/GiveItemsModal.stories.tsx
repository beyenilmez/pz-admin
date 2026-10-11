import { openStoryDialog } from "../../../../../.storybook/helpers/dialog";
import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import { prepareSupplyKit } from "../../../../../.storybook/helpers/itemSelection";
import { GiveItemsModal } from "./GiveItemsModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/GiveItemsModal",
  component: GiveItemsModal,
  args: {
    opened: true,
    onClose: fn(),
    onGive: fn(async () => true),
    players: makePlayers("sawyer"),
    build: "42",
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.giveItems.title", { count: args.players.length })}
        </Button>
        <GiveItemsModal
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
} satisfies Meta<typeof GiveItemsModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SinglePlayer: Story = {};
export const MultiplePlayers: Story = {
  args: { players: makePlayers("sawyer", "hurley") },
};

export const Showcase: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement, args }) => {
    const dialog = await openStoryDialog(
      canvasElement,
      args.opened,
      i18n.t("dialogs.giveItems.title", {
        ns: "players",
        count: args.players.length,
      }),
    );
    await prepareSupplyKit(dialog, args.build);
    await expect(
      within(dialog).getByRole("button", {
        name: i18n.t("dialogs.giveItems.submit", { ns: "players" }),
      }),
    ).toBeEnabled();
  },
};

import { prepareXpSelection } from "../../../../../.storybook/helpers/skills";
import { openStoryDialog } from "../../../../../.storybook/helpers/dialog";
import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddXpModal } from "@/features/players/actions/give/AddXpModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/AddXpModal",
  component: AddXpModal,
  args: {
    build: "42",
    opened: true,
    players: makePlayers("sawyer"),
    onAdd: fn(async () => true),
    onClose: fn(),
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.addXp.title")}
        </Button>
        <AddXpModal
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
} satisfies Meta<typeof AddXpModal>;
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
      i18n.t("dialogs.addXp.title", { ns: "players" }),
    );
    await prepareXpSelection(dialog, args.build);
  },
};

import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LightningPlayerModal } from "./LightningPlayerModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/LightningPlayerModal",
  component: LightningPlayerModal,
  args: {
    opened: true,
    onClose: fn(),
    onLightning: fn(async () => true),
    players: makePlayers("sawyer"),
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.lightning.title", { count: args.players.length })}
        </Button>
        <LightningPlayerModal
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
} satisfies Meta<typeof LightningPlayerModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SinglePlayer: Story = {};
export const MultiplePlayers: Story = {
  args: { players: makePlayers("sawyer", "hurley") },
};

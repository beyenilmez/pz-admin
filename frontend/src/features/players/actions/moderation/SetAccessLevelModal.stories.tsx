import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SetAccessLevelModal } from "./SetAccessLevelModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/SetAccessLevelModal",
  component: SetAccessLevelModal,
  args: {
    opened: true,
    onClose: fn(),
    onSetAccessLevel: fn(async () => true),
    players: makePlayers("sawyer"),
    build: "42",
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.setRole.title", { count: args.players.length })}
        </Button>
        <SetAccessLevelModal
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
} satisfies Meta<typeof SetAccessLevelModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SinglePlayer: Story = {};
export const MultiplePlayers: Story = {
  args: { players: makePlayers("sawyer", "hurley") },
};
export const Build41: Story = { args: { build: "41" } };
export const MixedAccessLevels: Story = {
  args: { players: makePlayers("jack", "kate") },
};

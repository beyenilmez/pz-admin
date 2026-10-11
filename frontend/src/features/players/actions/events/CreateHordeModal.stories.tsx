import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CreateHordeModal } from "./CreateHordeModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/CreateHordeModal",
  component: CreateHordeModal,
  args: {
    opened: true,
    onClose: fn(),
    onCreate: fn(async () => true),
    players: makePlayers("sawyer"),
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.createHorde.title", { count: args.players.length })}
        </Button>
        <CreateHordeModal
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
} satisfies Meta<typeof CreateHordeModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SinglePlayer: Story = {};
export const MultiplePlayers: Story = {
  args: { players: makePlayers("sawyer", "hurley") },
};

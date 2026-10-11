import { prepareVehicleSelection } from "../../../../../.storybook/helpers/vehicles";
import { openStoryDialog } from "../../../../../.storybook/helpers/dialog";
import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SpawnVehicleModal } from "./SpawnVehicleModal";
import { makePlayers } from "../../../../../.storybook/mocks/fixtures";

const meta = {
  title: "Features/Players/SpawnVehicleModal",
  component: SpawnVehicleModal,
  args: {
    opened: true,
    onClose: fn(),
    onSpawn: fn(async () => true),
    players: makePlayers("sawyer"),
    build: "42",
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.spawnVehicle.title", { count: args.players.length })}
        </Button>
        <SpawnVehicleModal
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
} satisfies Meta<typeof SpawnVehicleModal>;
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
      i18n.t("dialogs.spawnVehicle.title", {
        ns: "players",
        count: args.players.length,
      }),
    );
    await prepareVehicleSelection(dialog, args.build);
  },
};

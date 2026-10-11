import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddLocalPlayerModal } from "./AddLocalPlayerModal";

const meta = {
  title: "Features/Players/AddLocalPlayerModal",
  component: AddLocalPlayerModal,
  args: { opened: true, onClose: fn(), onAdd: fn(async () => true) },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.addLocalPlayer.title", { count: 1 })}
        </Button>
        <AddLocalPlayerModal
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
} satisfies Meta<typeof AddLocalPlayerModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

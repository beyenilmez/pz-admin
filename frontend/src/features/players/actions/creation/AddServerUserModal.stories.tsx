import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddServerUserModal } from "./AddServerUserModal";

const meta = {
  title: "Features/Players/AddServerUserModal",
  component: AddServerUserModal,
  args: { opened: true, onClose: fn(), onAdd: fn(async () => true) },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "players");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.addServerUser.title", { count: 1 })}
        </Button>
        <AddServerUserModal
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
} satisfies Meta<typeof AddServerUserModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

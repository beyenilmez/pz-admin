import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DeleteServerModal } from "./DeleteServerModal";
import { makeProfiles } from "../../../../../.storybook/mocks/profiles";
const meta = {
  title: "Features/Servers/DeleteServerModal",
  component: DeleteServerModal,
  args: {
    opened: true,
    profile: makeProfiles()[0],
    onClose: fn(),
    onDelete: fn(async () => {}),
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "servers");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("dialogs.delete.title")}
        </Button>
        <DeleteServerModal
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
} satisfies Meta<typeof DeleteServerModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

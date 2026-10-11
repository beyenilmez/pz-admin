import { useArgs } from "storybook/preview-api";
import { Button } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within, waitFor } from "storybook/test";
import i18n from "@/i18n";
import { ServerFormModal } from "./ServerFormModal";
import { makeProfiles } from "../../../../../.storybook/mocks/profiles";
const meta = {
  title: "Features/Servers/ServerFormModal",
  component: ServerFormModal,
  args: {
    opened: true,
    profile: null,
    onClose: fn(),
    onSave: fn(async () => {}),
  },
  render: function Dialog(args) {
    const [{ opened }, updateArgs] = useArgs<typeof args>();
    const t = i18n.getFixedT(null, "servers");
    return (
      <>
        <Button m="xl" onClick={() => updateArgs({ opened: true })}>
          {t("form.add.title")}
        </Button>
        <ServerFormModal
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
} satisfies Meta<typeof ServerFormModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Create: Story = {};
export const Edit: Story = { args: { profile: makeProfiles()[0] } };
export const SaveError: Story = {
  args: {
    profile: makeProfiles()[0],
    onSave: fn(async () => {
      throw new Error(`profile: not found: ${makeProfiles()[0].id}`);
    }),
  },
  play: async () => {
    const dialog = within(await within(document.body).findByRole("dialog"));
    await userEvent.click(
      dialog.getByRole("button", { name: i18n.t("actions.saveChanges") }),
    );
    await waitFor(async () => {
      await expect(dialog.findByRole("alert")).resolves.toBeVisible();
    });
  },
};

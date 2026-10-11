import { useArgs } from "storybook/preview-api";
import { Box } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import i18n from "@/i18n";
import { MessageEditorDialog } from "./MessageEditorDialog";
const meta = {
  title: "Features/Messages/MessageEditorDialog",
  component: MessageEditorDialog,
  args: {
    build: "42",
    value:
      "<SIZE:large> Welcome to Riverside <LINE> <SIZE:medium> Cooperate, explore, survive.",
    onChange: fn(),
  },
  render: function Editor(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Box p="xl">
        <MessageEditorDialog
          {...args}
          value={value}
          onChange={(nextValue) => {
            args.onChange(nextValue);
            updateArgs({ value: nextValue });
          }}
        />
      </Box>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: i18n.t("actions.edit", { ns: "messages" }),
      }),
    );
    await waitFor(async () => {
      await expect(
        within(document.body).findByRole("dialog"),
      ).resolves.toBeVisible();
    });
  },
} satisfies Meta<typeof MessageEditorDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { value: "" } };
export const OverLimit: Story = { args: { maxBytes: 10 } };

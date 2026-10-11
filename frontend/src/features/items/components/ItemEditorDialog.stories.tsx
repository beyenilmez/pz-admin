import { useArgs } from "storybook/preview-api";
import { Box } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import i18n from "@/i18n";
import { ItemEditorDialog } from "./ItemEditorDialog";
import { serializeItemSelection } from "../lib/itemSelection";
import { loadItemCatalog } from "../catalog";
const meta = {
  title: "Features/Items/ItemEditorDialog",
  component: ItemEditorDialog,
  args: {
    build: "42",
    value: serializeItemSelection(
      new Map([
        ["Base.Axe", 1],
        ["Base.Bandage", 2],
      ]),
    ),
    onChange: fn(),
  },
  render: function Editor(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Box p="xl">
        <ItemEditorDialog
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
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: i18n.t("editor.actions.edit", { ns: "items" }),
      }),
    );
    await waitFor(async () => {
      await expect(
        within(document.body).findByRole("dialog"),
      ).resolves.toBeVisible();
    });
    const dialog = within(await within(document.body).findByRole("dialog"));
    if (args.value === "") {
      await expect(
        dialog.getByText(i18n.t("selection.empty", { ns: "items" })),
      ).toBeVisible();
    } else {
      const catalog = await loadItemCatalog(args.build, i18n.language);
      await Promise.all(
        [
          ["Base.Axe", "1"],
          ["Base.Bandage", "2"],
        ].map(async ([id, quantity]) => {
          const item = catalog.itemsById.get(id)!;
          await waitFor(async () => {
            await expect(
              dialog.getByLabelText(
                i18n.t("selection.quantity.label", {
                  ns: "items",
                  name: item.name,
                }),
              ),
            ).toHaveValue(quantity);
            await expect(dialog.getByText(id, { exact: true })).toBeVisible();
          });
        }),
      );
    }
    const apply = dialog.getByRole("button", { name: i18n.t("actions.apply") });
    if (args.maxBytes !== undefined) await expect(apply).toBeDisabled();
    else await expect(apply).toBeEnabled();
  },
} satisfies Meta<typeof ItemEditorDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { value: "" } };
export const OverLimit: Story = { args: { maxBytes: 10 } };

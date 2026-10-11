import { prepareOptionsShowcase } from "../../../.storybook/helpers/options";
import { UpdateResult } from "@bindings/internal/options/models";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import i18n from "@/i18n";
import { OptionsPage } from "./OptionsPage";
import { List, Update } from "../../../.storybook/mocks/options";
const meta = {
  title: "Features/Options/OptionsPage",
  component: OptionsPage,
  args: { active: true },
  beforeEach: () => {
    List.mockReset();
    Update.mockReset();
    return () => {
      List.mockReset();
      Update.mockReset();
    };
  },
} satisfies Meta<typeof OptionsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByRole("textbox", {
          name: i18n.t("navigation.search.label", { ns: "options" }),
        }),
      ).resolves.toBeVisible();
    });
  },
};
export const LoadError: Story = {
  beforeEach: () => {
    List.mockRejectedValue(new Error("rcon: execute: command timed out"));
  },
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByRole("alert"),
      ).resolves.toBeVisible();
    });
  },
};
export const NoSearchResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole("textbox", {
        name: i18n.t("navigation.search.label", { ns: "options" }),
      }),
      "no-matching-option",
    );
    await waitFor(async () => {
      await expect(
        canvas.findByText(i18n.t("navigation.search.empty", { ns: "options" })),
      ).resolves.toBeVisible();
    });
  },
};

function categoryStory(
  id: "gameplay" | "social" | "maintenance" | "security",
): Story {
  return {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const label = i18n.t(`categories.${id}`, { ns: "optionCatalog" });
      const button = await canvas.findByRole("button", {
        name: (name) => name.startsWith(label),
      });
      await userEvent.click(button);
      await expect(button).toHaveAttribute("aria-current", "page");
    },
  };
}
export const Gameplay: Story = categoryStory("gameplay");
export const Social: Story = categoryStory("social");
export const Maintenance: Story = categoryStory("maintenance");
export const Security: Story = categoryStory("security");

export const UnsavedChanges: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement }) => {
    await prepareOptionsShowcase(canvasElement);
  },
};
export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.clear(
      await canvas.findByLabelText(
        i18n.t("fields.MaxPlayers.label", { ns: "optionCatalog" }),
      ),
    );
    await waitFor(async () => {
      await expect(
        canvas.findByText(i18n.t("validation.number", { ns: "options" })),
      ).resolves.toBeVisible();
    });
    await expect(
      canvas.getByRole("button", { name: i18n.t("actions.saveChanges") }),
    ).toBeDisabled();
  },
};

export const UpdateFailed: Story = {
  beforeEach: () => {
    Update.mockResolvedValue(
      new UpdateResult({
        updated: [],
        failed: { PublicName: "rcon: execute: command timed out" },
      }),
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByLabelText(
      i18n.t("fields.PublicName.label", { ns: "optionCatalog" }),
    );
    await userEvent.clear(input);
    await userEvent.type(input, "Riverside Cooperative");
    await userEvent.click(
      canvas.getByRole("button", { name: i18n.t("actions.saveChanges") }),
    );
    await waitFor(() =>
      expect(
        within(document.body).getByText(
          i18n.t("notifications.updateFailed.message", {
            ns: "options",
            count: 1,
          }),
        ),
      ).toBeVisible(),
    );
    await expect(input).toHaveValue("Riverside Cooperative");
    await expect(
      canvas.getByText("rcon: execute: command timed out"),
    ).toBeVisible();
  },
};

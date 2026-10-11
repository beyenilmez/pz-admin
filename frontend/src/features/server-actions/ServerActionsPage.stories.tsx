import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import i18n from "@/i18n";
import { ServerActionsPage } from "./ServerActionsPage";
import { List } from "../../../.storybook/mocks/players";
const meta = {
  title: "Features/ServerActions/ServerActionsPage",
  component: ServerActionsPage,
  beforeEach: () => {
    List.mockReset();
    return () => {
      List.mockReset();
    };
  },
} satisfies Meta<typeof ServerActionsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NoOnlinePlayers: Story = {
  beforeEach: () => {
    List.mockResolvedValue([]);
  },
};
export const SendMessageOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: i18n.t("actions.sendMessage", { ns: "serverActions" }),
      }),
    );
    await waitFor(async () => {
      await expect(
        within(document.body).findByRole("dialog"),
      ).resolves.toBeVisible();
    });
  },
};
export const StopConfirmationOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: i18n.t("actions.stopServer", { ns: "serverActions" }),
      }),
    );
    await waitFor(async () => {
      await expect(
        within(document.body).findByRole("dialog"),
      ).resolves.toBeVisible();
    });
  },
};

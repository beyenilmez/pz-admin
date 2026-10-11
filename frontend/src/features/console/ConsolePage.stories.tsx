import { prepareConsoleShowcase } from "../../../.storybook/helpers/console";
import {
  loadAppConfig,
  withAppConfig,
} from "../../../.storybook/decorators/withAppConfig";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import i18n from "@/i18n";
import { ConsolePage } from "./ConsolePage";
import { Execute } from "../../../.storybook/mocks/console";
const meta = {
  loaders: [loadAppConfig],
  decorators: [withAppConfig],
  title: "Features/Console/ConsolePage",
  component: ConsolePage,
  beforeEach: () => {
    Execute.mockReset();
    return () => {
      Execute.mockReset();
    };
  },
} satisfies Meta<typeof ConsolePage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const CommandResult: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement }) => {
    await prepareConsoleShowcase(canvasElement);
  },
};
export const CommandError: Story = {
  beforeEach: () => {
    Execute.mockRejectedValue(
      new Error("console: execute command: rcon: execute: command timed out"),
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox"), "players{Escape}{Enter}");
    await waitFor(async () => {
      await expect(
        canvas.findByText("command timed out"),
      ).resolves.toBeVisible();
    });
  },
};

export const CommandWithoutOutput: Story = {
  beforeEach: () => {
    // Exercise a successful empty response, independently of the command's usual output.
    Execute.mockResolvedValue("");
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", {
        name: i18n.t("command.label", { ns: "console" }),
      }),
      "save{Escape}{Enter}",
    );
    const output = await canvas.findByText(
      i18n.t("output.empty", { ns: "console" }),
    );
    await expect(output).toBeVisible();
    await expect(output.closest("[data-status]")).toHaveAttribute(
      "data-status",
      "success",
    );
  },
};

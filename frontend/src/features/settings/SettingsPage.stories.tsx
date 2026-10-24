import i18n from "@/i18n";
import { System } from "../../../.storybook/mocks/runtime";
import { Report } from "../../../.storybook/mocks/diagnostics";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mantine/core";
import { expect, within, waitFor } from "storybook/test";
import { SettingsPage } from "./SettingsPage";
import {
  loadAppConfig,
  withAppConfig,
} from "../../../.storybook/decorators/withAppConfig";
const meta = {
  beforeEach: () => {
    Report.mockReset();
    System.IsWindows.mockReset();
    return () => {
      Report.mockReset();
      System.IsWindows.mockReset();
    };
  },
  title: "Features/Settings/SettingsPage",
  component: SettingsPage,
  loaders: [loadAppConfig],
  decorators: [
    withAppConfig,
    (Story) => (
      <Box p="xl" maw={1000} mx="auto">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof SettingsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByText(/os: linux/),
      ).resolves.toBeVisible();
    });
  },
};

export const AutomaticUpdates: Story = {
  beforeEach: () => {
    System.IsWindows.mockReturnValue(true);
    Report.mockResolvedValue({
      version: APP_VERSION,
      os: "windows",
      arch: "amd64",
      debug_build: false,
      "os_details.name": "Windows",
      "os_details.version": "11",
    });
  },
};
export const DiagnosticsError: Story = {
  beforeEach: () => {
    // A runtime failure without details exercises the translated fallback.
    Report.mockRejectedValue(new Error());
  },
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByText(i18n.t("errors.unexpected")),
      ).resolves.toBeVisible();
    });
  },
};

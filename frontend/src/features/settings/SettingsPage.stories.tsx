import i18n from "@/i18n";
import { System } from "../../../.storybook/mocks/runtime";
import { Flatpak } from "../../../.storybook/mocks/diagnostics";
import { FlatpakInfo } from "@bindings/internal/diagnostics/models";
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
    Flatpak.mockReset();
    System.Environment.mockReset();
    System.IsWindows.mockReset();
    return () => {
      Flatpak.mockReset();
      System.Environment.mockReset();
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
    System.Environment.mockResolvedValue({
      OS: "windows",
      Arch: "amd64",
      Debug: false,
      OSInfo: { Name: "Windows", Version: "11" },
      PlatformInfo: { DesktopEnvironment: "Windows" },
    });
  },
};
export const FlatpakInstallation: Story = {
  beforeEach: () => {
    Flatpak.mockResolvedValue(
      new FlatpakInfo({
        appId: "com.bedirhanyenilmez.pzadmin",
        version: "1.18.2",
        branch: "stable",
        runtime: "runtime/org.gnome.Platform/x86_64/51",
      }),
    );
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).findByText(/flatpak: true/),
    ).resolves.toBeVisible();
  },
};
export const DiagnosticsError: Story = {
  beforeEach: () => {
    // A runtime failure without details exercises the translated fallback.
    System.Environment.mockRejectedValue(new Error());
  },
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByText(i18n.t("errors.unexpected")),
      ).resolves.toBeVisible();
    });
  },
};

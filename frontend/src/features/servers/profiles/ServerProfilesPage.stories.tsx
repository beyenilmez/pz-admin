import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, waitFor } from "storybook/test";
import { ServerProfilesPage } from "./ServerProfilesPage";
import {
  loadAppConfig,
  withAppConfig,
} from "../../../../.storybook/decorators/withAppConfig";
import { List, Save, Delete } from "../../../../.storybook/mocks/profiles";
const meta = {
  title: "Features/Servers/ServerProfilesPage",
  component: ServerProfilesPage,
  loaders: [loadAppConfig],
  decorators: [withAppConfig],
  beforeEach: () => {
    List.mockReset();
    Save.mockReset();
    Delete.mockReset();
    return () => {
      List.mockReset();
      Save.mockReset();
      Delete.mockReset();
    };
  },
} satisfies Meta<typeof ServerProfilesPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByText("Riverside Community"),
      ).resolves.toBeVisible();
    });
  },
};
export const Empty: Story = {
  beforeEach: () => {
    List.mockResolvedValue([]);
  },
};
export const LoadError: Story = {
  beforeEach: () => {
    List.mockRejectedValue(new Error("profile: service not started"));
  },
};

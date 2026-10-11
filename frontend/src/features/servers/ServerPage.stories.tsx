import { expect, within } from "storybook/test";
import i18n from "@/i18n";
import {
  List as ListOptions,
  Update as UpdateOptions,
} from "../../../.storybook/mocks/options";
import { Snapshot } from "../../../.storybook/mocks/session";
import { Snapshot as SnapshotModel } from "@bindings/internal/session/models";
import {
  loadAppConfig,
  withAppConfig,
} from "../../../.storybook/decorators/withAppConfig";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ServerPage } from "./ServerPage";
const meta = {
  loaders: [loadAppConfig],
  decorators: [withAppConfig],
  beforeEach: () => {
    Snapshot.mockReset();
    ListOptions.mockReset();
    UpdateOptions.mockReset();
    return () => {
      Snapshot.mockReset();
      ListOptions.mockReset();
      UpdateOptions.mockReset();
    };
  },
  title: "Features/Servers/ServerPage",
  component: ServerPage,
} satisfies Meta<typeof ServerPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Disconnected: Story = {
  beforeEach: () => {
    Snapshot.mockResolvedValue(new SnapshotModel());
  },
};
export const InitializationError: Story = {
  beforeEach: () => {
    // Snapshot has no backend error result; cover a bridge failure without details.
    Snapshot.mockRejectedValue(new Error());
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(i18n.t("errors.unexpected")),
    ).toBeVisible();
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, waitFor } from "storybook/test";
import { Read } from "../../../.storybook/mocks/logger";
import { Entry, Update } from "@bindings/internal/logger/models";
import { LogWindow } from "./LogWindow";

const meta = {
  title: "Features/Logs/LogWindow",
  component: LogWindow,
  beforeEach: () => {
    Read.mockReset();
    return () => {
      Read.mockReset();
    };
  },
} satisfies Meta<typeof LogWindow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CurrentSession: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByText(/application started/),
    ).resolves.toBeVisible();
    await expect(canvas.findByText("[truncated]")).resolves.toBeVisible();
  },
};
export const ReadError: Story = {
  beforeEach: () => {
    Read.mockRejectedValue(new Error("Could not load session logs"));
  },
};
export const LongSession: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const output = await canvas.findByRole("region", { name: "Log entries" });
    await waitFor(() =>
      expect(output.querySelectorAll("[data-level]")).toHaveLength(10000),
    );
  },
  beforeEach: () => {
    const entries = Array.from(
      { length: 10000 },
      (_, i) =>
        new Entry({
          id: i + 2,
          text: `time=2026-10-20T12:00:00Z level=DEBUG msg="received server response" command=players detail="${"A long response with several fields. ".repeat((i % 8) + 1)}"`,
          level: "DEBUG",
        }),
    );
    Read.mockImplementation(
      async (afterID) =>
        new Update({
          entries: entries.filter((entry) => entry.id > afterID),
          firstID: 2,
        }),
    );
  },
};

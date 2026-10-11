import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";
import { NoticesButton } from "./NoticesButton";
import { Report } from "../../../../.storybook/mocks/notices";

const meta = {
  title: "Features/Settings/NoticesButton",
  component: NoticesButton,
  beforeEach: () => {
    Report.mockReset();
    return () => {
      Report.mockReset();
    };
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: i18n.t("notices.title", { ns: "settings" }),
      }),
    );
    await waitFor(async () => {
      await expect(
        within(document.body).findByRole("dialog"),
      ).resolves.toBeVisible();
    });
  },
} satisfies Meta<typeof NoticesButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LoadError: Story = {
  beforeEach: () => {
    Report.mockRejectedValue(
      new Error(
        "read embedded third-party notices: unexpected end of JSON input",
      ),
    );
  },
};
export const NoSearchResults: Story = {
  play: async (context) => {
    await meta.play(context);
    const dialog = within(await within(document.body).findByRole("dialog"));
    await userEvent.type(
      await dialog.findByRole("textbox", {
        name: i18n.t("notices.search.label", { ns: "settings" }),
      }),
      "missing-library",
    );
    await waitFor(async () => {
      await expect(
        dialog.findByText(i18n.t("notices.search.empty", { ns: "settings" })),
      ).resolves.toBeVisible();
    });
  },
};

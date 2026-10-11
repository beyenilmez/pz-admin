import { preparePlayersShowcase } from "../../../.storybook/helpers/players";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { PlayersPage } from "@/features/players/PlayersPage";
import i18n from "@/i18n";
import { List } from "../../../.storybook/mocks/players";

const meta = {
  title: "Features/Players/PlayersPage",
  component: PlayersPage,
  beforeEach: () => {
    List.mockReset();
    return () => {
      List.mockReset();
    };
  },
} satisfies Meta<typeof PlayersPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(
        within(canvasElement).findByText("jack"),
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
    List.mockRejectedValue(new Error("player: service not started"));
  },
};
export const ActionMenuOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole("button", {
      name: i18n.t("actions.menu.label", {
        ns: "players",
        username: "jack",
      }),
    });
    await userEvent.click(button);
    await waitFor(async () => {
      await expect(
        within(document.body).findByRole("menu"),
      ).resolves.toBeVisible();
    });
  },
};

export const Showcase: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement }) => {
    await preparePlayersShowcase(canvasElement);
  },
};

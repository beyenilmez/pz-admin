import { prepareSupplyKit } from "../../../.storybook/helpers/itemSelection";
import i18n from "@/i18n";
import { useArgs } from "storybook/preview-api";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ItemsPage } from "./ItemsPage";
import type { GameBuild } from "@/features/game/types";

const meta = {
  title: "Features/Items/ItemsPage",
  component: ItemsPage,
  args: { build: "42", onBuildChange: fn() },
  render: function ToolScreen(args) {
    const [, updateArgs] = useArgs<{ build: GameBuild }>();
    return (
      <ItemsPage
        {...args}
        onBuildChange={(build) => {
          updateArgs({ build });
          args.onBuildChange(build);
        }}
      />
    );
  },
} satisfies Meta<typeof ItemsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

// A supply kit being assembled while the catalog is filtered to axes.
export const Showcase: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement, args }) => {
    await prepareSupplyKit(canvasElement, args.build);
  },
};

export const NoSearchResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = await canvas.findByRole("textbox", {
      name: i18n.t("browser.search.label", { ns: "items" }),
    });
    await waitFor(() => expect(search).toBeEnabled());
    await userEvent.type(search, "no-matching-item");
    await waitFor(async () => {
      await expect(
        canvas.findByText(i18n.t("browser.search.empty", { ns: "items" })),
      ).resolves.toBeVisible();
    });
  },
};

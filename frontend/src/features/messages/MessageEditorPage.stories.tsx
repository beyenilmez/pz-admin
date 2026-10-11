import { prepareMessageShowcase } from "../../../.storybook/helpers/messages";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageEditorPage } from "./MessageEditorPage";
import type { GameBuild } from "@/features/game/types";

const meta = {
  title: "Features/Messages/MessageEditorPage",
  component: MessageEditorPage,
  args: { build: "42", onBuildChange: fn() },
  render: function ToolScreen(args) {
    const [, updateArgs] = useArgs<{ build: GameBuild }>();
    return (
      <MessageEditorPage
        {...args}
        onBuildChange={(build) => {
          updateArgs({ build });
          args.onBuildChange(build);
        }}
      />
    );
  },
} satisfies Meta<typeof MessageEditorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Showcase: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement, args }) => {
    await prepareMessageShowcase(canvasElement, args.build);
  },
};

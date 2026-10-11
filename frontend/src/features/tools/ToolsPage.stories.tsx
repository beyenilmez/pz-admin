import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToolsPage } from "./ToolsPage";
const meta = {
  title: "Features/Tools/ToolsPage",
  component: ToolsPage,
} satisfies Meta<typeof ToolsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

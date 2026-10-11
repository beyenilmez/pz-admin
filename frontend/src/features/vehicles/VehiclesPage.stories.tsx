import {
  prepareVehicleComparison,
  prepareVehicleDetails,
} from "../../../.storybook/helpers/vehicles";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { VehiclesPage } from "./VehiclesPage";
import type { GameBuild } from "@/features/game/types";

const meta = {
  title: "Features/Vehicles/VehiclesPage",
  component: VehiclesPage,
  args: { build: "42", onBuildChange: fn() },
  render: function ToolScreen(args) {
    const [, updateArgs] = useArgs<{ build: GameBuild }>();
    return (
      <VehiclesPage
        {...args}
        onBuildChange={(build) => {
          updateArgs({ build });
          args.onBuildChange(build);
        }}
      />
    );
  },
} satisfies Meta<typeof VehiclesPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Showcase: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement, args }) => {
    await prepareVehicleComparison(canvasElement, args.build);
  },
};

export const ShowcaseDetails: Story = {
  tags: ["showcase"],
  play: async ({ canvasElement }) => {
    await prepareVehicleDetails(canvasElement);
  },
};

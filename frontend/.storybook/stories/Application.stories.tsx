import { latestGameBuild } from "@/features/game/types";
import { prepareSupplyKit } from "../helpers/itemSelection";
import {
  prepareVehicleComparison,
  prepareVehicleDetails,
  prepareVehicleSelection,
} from "../helpers/vehicles";
import { prepareMessageShowcase } from "../helpers/messages";
import { prepareOptionsShowcase } from "../helpers/options";
import { prepareConsoleShowcase } from "../helpers/console";
import { prepareXpSelection } from "../helpers/skills";
import { List as ListOptions, Update as UpdateOptions } from "../mocks/options";
import { Execute } from "../mocks/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { App } from "@/app/App";
import i18n from "@/i18n";
import { loadAppConfig, withAppConfig } from "../decorators/withAppConfig";
import { preparePlayersShowcase } from "../helpers/players";
import { List } from "../mocks/players";
import { Snapshot } from "../mocks/session";

function resetApplicationMocks() {
  List.mockReset();
  Snapshot.mockReset();
  ListOptions.mockReset();
  UpdateOptions.mockReset();
  Execute.mockReset();
}

const meta = {
  title: "Showcases/Application",
  component: App,
  tags: ["showcase"],
  loaders: [loadAppConfig],
  decorators: [withAppConfig],
  beforeEach: () => {
    resetApplicationMocks();
    return resetApplicationMocks;
  },
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Players: Story = {
  play: async ({ canvasElement }) => {
    await preparePlayersShowcase(
      await openPage(canvasElement, "servers", "players"),
    );
  },
};

async function openPage(
  canvasElement: HTMLElement,
  section: "servers" | "tools",
  page:
    | "players"
    | "options"
    | "serverActions"
    | "console"
    | "items"
    | "vehicles"
    | "messages",
) {
  const canvas = within(canvasElement);
  await userEvent.click(
    canvas.getByRole("tab", {
      name: i18n.t("page.title", { ns: section }),
    }),
  );
  const tab = await canvas.findByRole("tab", {
    name: i18n.t("page.title", { ns: page }),
  });
  await userEvent.click(tab);
  await expect(tab).toHaveAttribute("aria-selected", "true");
  const panelId = tab.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) throw new Error("The selected application panel is missing.");
  return panel;
}

async function openPlayerDialog(
  canvasElement: HTMLElement,
  action: "giveItems" | "addXp" | "spawnVehicle",
) {
  const panel = within(await openPage(canvasElement, "servers", "players"));
  await userEvent.click(
    await panel.findByRole("button", {
      name: i18n.t("actions.menu.label", { ns: "players", username: "sawyer" }),
    }),
  );
  const body = within(document.body);
  await userEvent.hover(
    await body.findByRole("menuitem", {
      name: i18n.t("actions.groups.give", { ns: "players" }),
    }),
  );
  await userEvent.click(
    await body.findByRole("menuitem", {
      name: i18n.t(`actions.commands.${action}`, { ns: "players" }),
    }),
  );
  const dialog = await body.findByRole("dialog");
  await waitFor(() => expect(dialog).toBeVisible());
  return dialog;
}

export const Items: Story = {
  play: async ({ canvasElement }) => {
    await prepareSupplyKit(
      await openPage(canvasElement, "tools", "items"),
      latestGameBuild,
    );
  },
};

export const Vehicles: Story = {
  play: async ({ canvasElement }) => {
    await prepareVehicleComparison(
      await openPage(canvasElement, "tools", "vehicles"),
      latestGameBuild,
    );
  },
};

export const VehicleDetails: Story = {
  play: async ({ canvasElement }) => {
    await prepareVehicleDetails(
      await openPage(canvasElement, "tools", "vehicles"),
    );
  },
};

export const MessageEditor: Story = {
  play: async ({ canvasElement }) => {
    await prepareMessageShowcase(
      await openPage(canvasElement, "tools", "messages"),
      latestGameBuild,
    );
  },
};

export const Options: Story = {
  play: async ({ canvasElement }) => {
    await prepareOptionsShowcase(
      await openPage(canvasElement, "servers", "options"),
    );
  },
};

export const Console: Story = {
  play: async ({ canvasElement }) => {
    await prepareConsoleShowcase(
      await openPage(canvasElement, "servers", "console"),
    );
  },
};

export const ServerActions: Story = {
  play: async ({ canvasElement }) => {
    const panel = within(
      await openPage(canvasElement, "servers", "serverActions"),
    );
    await expect(
      panel.getByRole("button", {
        name: i18n.t("actions.saveWorld", { ns: "serverActions" }),
      }),
    ).toBeEnabled();
    await expect(
      panel.getByRole("button", {
        name: i18n.t("actions.sendMessage", { ns: "serverActions" }),
      }),
    ).toBeVisible();
  },
};

export const GiveItems: Story = {
  play: async ({ canvasElement }) => {
    await prepareSupplyKit(
      await openPlayerDialog(canvasElement, "giveItems"),
      latestGameBuild,
    );
  },
};

export const AddXp: Story = {
  play: async ({ canvasElement }) => {
    await prepareXpSelection(
      await openPlayerDialog(canvasElement, "addXp"),
      latestGameBuild,
    );
  },
};

export const SpawnVehicle: Story = {
  play: async ({ canvasElement }) => {
    await prepareVehicleSelection(
      await openPlayerDialog(canvasElement, "spawnVehicle"),
      latestGameBuild,
    );
  },
};

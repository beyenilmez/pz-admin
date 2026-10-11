import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";
import { loadVehicleCatalog } from "@/features/vehicles/catalog";
import type { GameBuild } from "@/features/game/types";

export async function prepareVehicleComparison(
  canvasElement: HTMLElement,
  build: GameBuild,
) {
  const canvas = within(canvasElement);
  const search = await canvas.findByRole("textbox", {
    name: i18n.t("browser.search.label", { ns: "vehicles" }),
  });
  await waitFor(() => expect(search).toBeEnabled());
  const catalog = await loadVehicleCatalog(build, i18n.language);
  const category = catalog.vehiclesById.get("Base.PickUpTruck")!.category;
  const hierarchy = canvas.getByRole("tree");
  await userEvent.click(
    within(hierarchy).getByRole("button", {
      name: i18n.t("actions.expandNamed", { name: category }),
    }),
  );
  // Compare emergency vehicles across categories rather than near-identical vans.
  await userEvent.type(search, "police");
  await userEvent.click(
    canvas.getByRole("combobox", { name: i18n.t("sorting.label") }),
  );
  await userEvent.click(
    within(document.body).getByRole("option", {
      name: i18n.t("stats.totalStorage", { ns: "vehicles" }),
    }),
  );
  await waitFor(async () => {
    await expect(
      canvas.getByRole("combobox", { name: i18n.t("sorting.label") }),
    ).toHaveValue(i18n.t("stats.totalStorage", { ns: "vehicles" }));
    await expect(canvas.getAllByRole("listitem").length).toBeGreaterThan(3);
  });
  await userEvent.click(canvas.getByRole("heading", { level: 1 }));
}

export async function prepareVehicleDetails(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const search = await canvas.findByRole("textbox", {
    name: i18n.t("browser.search.label", { ns: "vehicles" }),
  });
  await waitFor(() => expect(search).toBeEnabled());
  await userEvent.type(search, "Base.CarLightsPolice");
  await userEvent.click(
    await canvas.findByRole("button", {
      name: (_name, element) =>
        element.id === "vehicle-result-Base.CarLightsPolice",
    }),
  );
  await expect(
    await canvas.findByRole("heading", {
      name: i18n.t("variants.title", { ns: "vehicles" }),
    }),
  ).toBeVisible();
  await expect(
    canvas.getByText("Base.CarLightsPolice", { exact: true }),
  ).toBeVisible();
  await userEvent.click(
    canvas.getByRole("heading", {
      name: i18n.t("variants.title", { ns: "vehicles" }),
    }),
  );
}

export async function prepareVehicleSelection(
  element: HTMLElement,
  build: GameBuild,
) {
  const dialog = within(element);
  const catalog = await loadVehicleCatalog(build, i18n.language);
  const vehicle = catalog.vehiclesById.get("Base.CarLightsPolice")!;
  await userEvent.click(
    await dialog.findByRole("button", {
      name: vehicle.category,
    }),
  );
  await userEvent.click(
    await dialog.findByRole("button", { name: vehicle.name }),
  );
  const variant = await dialog.findByRole("button", {
    name: i18n.t("picker.actions.selectVariant", {
      ns: "vehicles",
      variant: vehicle.variant,
    }),
  });
  await userEvent.click(variant);
  await expect(variant).toHaveAttribute("aria-current", "true");
  await expect(dialog.getByText(vehicle.id, { exact: true })).toBeVisible();
  await waitFor(() =>
    expect(
      dialog.getByRole("button", {
        name: i18n.t("dialogs.spawnVehicle.submit", { ns: "players" }),
      }),
    ).toBeEnabled(),
  );
  await userEvent.click(dialog.getByRole("heading"));
}

import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";
import { loadItemCatalog } from "@/features/items/catalog";
import type { GameBuild } from "@/features/game/types";

export async function prepareSupplyKit(element: HTMLElement, build: GameBuild) {
  const canvas = within(element);
  const search = await canvas.findByRole("textbox", {
    name: i18n.t("browser.search.label", { ns: "items" }),
  });
  await waitFor(() => expect(search).toBeEnabled());
  const catalog = await loadItemCatalog(build, i18n.language);
  const customItem = canvas.getByRole("textbox", {
    name: i18n.t("selection.customItem.label", { ns: "items" }),
  });
  const kit = [
    ["Base.Axe", 1],
    ["Base.HandAxe", 2],
    ["Base.Hammer", 1],
    ["Base.NailsBox", 3],
    ["Base.Bandage", 8],
    ["Base.WaterBottle", 4],
    ["Base.HandTorch", 2],
    ["Base.TinnedBeans", 6],
  ] as const;
  // Each item reuses the same input and must render before its quantity is set.
  /* eslint-disable no-await-in-loop */
  for (const [id, count] of kit) {
    await userEvent.type(customItem, `${id}{Enter}`);
    const item = catalog.itemsById.get(id)!;
    const quantity = await canvas.findByRole("textbox", {
      name: i18n.t("selection.quantity.label", {
        ns: "items",
        name: item.name,
      }),
    });
    await userEvent.clear(quantity);
    await userEvent.type(quantity, String(count));
    await expect(quantity).toHaveValue(String(count));
  }
  /* eslint-enable no-await-in-loop */
  await userEvent.type(search, "axe");
  const category = catalog.itemsById.get("Base.Axe")!.category;
  await userEvent.click(
    await canvas.findByRole("button", {
      expanded: false,
      name: (name) => name.startsWith(category),
    }),
  );
  await waitFor(() => expect(canvas.getByTitle("Base.Axe")).toBeVisible());
  await expect(canvas.getByTitle("Base.Axe")).toHaveAttribute(
    "data-selected",
    "true",
  );
  await userEvent.click(
    canvas.getByRole("heading", {
      name: i18n.t("selection.title", { ns: "items" }),
    }),
  );
}

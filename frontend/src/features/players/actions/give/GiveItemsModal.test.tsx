import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemGrant, Player } from "@bindings/internal/player/models";
import { useItemCatalog } from "@/features/items/hooks/useItemCatalog";
import type { ItemCatalog, ItemCatalogEntry } from "@/features/items/types";
import i18n from "@/i18n";
import { fireEvent, render, screen, waitFor } from "@/test/render";
import { GiveItemsModal } from "./GiveItemsModal";

vi.mock("@/features/items/hooks/useItemCatalog", () => ({
  useItemCatalog: vi.fn(),
}));

const banana = {
  build: "42",
  category: "Food",
  categoryId: "food",
  defaultName: "Banana",
  id: "Base.Banana",
  images: [],
  name: "Banana",
} satisfies ItemCatalogEntry;

const apple = {
  build: "42",
  category: "Food",
  categoryId: "food",
  defaultName: "Apple",
  id: "Base.Apple",
  images: [],
  name: "Apple",
} satisfies ItemCatalogEntry;

const items = [banana, apple];
const catalog = {
  build: "42",
  categories: [{ id: "food", itemCount: items.length, name: "Food" }],
  items,
  itemsById: new Map(items.map((item) => [item.id, item])),
  language: "en-US",
  searchIndex: new Map(
    items.map((item) => [item.id, `${item.name} ${item.id}`.toLowerCase()]),
  ),
} satisfies ItemCatalog;

const players = [
  new Player({ id: "alpha", username: "Alice" }),
  new Player({ id: "bravo", username: "Bob" }),
];

const submitName = i18n.t("dialogs.giveItems.submit", { ns: "players" });
interface HarnessProps {
  onGive: (targets: Player[], grants: ItemGrant[]) => Promise<boolean>;
}

function addItem(item: ItemCatalogEntry) {
  const customItem = screen.getByRole("textbox", {
    name: i18n.t("selection.customItem.label", { ns: "items" }),
  });
  fireEvent.change(customItem, { target: { value: item.id } });
  fireEvent.click(
    screen.getByRole("button", {
      name: i18n.t("selection.customItem.actions.add", { ns: "items" }),
    }),
  );
}

beforeEach(() => {
  vi.mocked(useItemCatalog).mockReturnValue({
    catalog,
    error: null,
    loading: false,
    reload: vi.fn(),
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GiveItemsModal", () => {
  it("builds an ordered item grant payload", async () => {
    const onClose = vi.fn();
    const onGive = vi.fn<HarnessProps["onGive"]>().mockResolvedValue(false);
    render(
      <GiveItemsModal
        build="42"
        onClose={onClose}
        onGive={onGive}
        opened
        players={players}
      />,
    );

    const submit = screen.getByRole("button", { name: submitName });
    addItem(apple);
    addItem(banana);
    const bananaQuantity = screen.getByRole("textbox", {
      name: i18n.t("selection.quantity.label", {
        name: banana.name,
        ns: "items",
      }),
    });
    const appleQuantity = screen.getByRole("textbox", {
      name: i18n.t("selection.quantity.label", {
        name: apple.name,
        ns: "items",
      }),
    });
    fireEvent.change(bananaQuantity, { target: { value: "3" } });
    fireEvent.change(appleQuantity, { target: { value: "2" } });

    fireEvent.click(submit);

    await waitFor(() => expect(onGive).toHaveBeenCalledOnce());
    const [submittedTargets, submittedGrants] = onGive.mock.calls[0];
    expect(submittedTargets.map((target) => target.id)).toEqual([
      "alpha",
      "bravo",
    ]);
    expect(submittedGrants).toEqual([
      new ItemGrant({ count: 2, item: apple.id }),
      new ItemGrant({ count: 3, item: banana.id }),
    ]);
    expect(onClose).not.toHaveBeenCalled();
  });
});

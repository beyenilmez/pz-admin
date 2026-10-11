import { expect, userEvent, within } from "storybook/test";
import i18n from "@/i18n";

export async function prepareOptionsShowcase(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const search = await canvas.findByRole("textbox", {
    name: i18n.t("navigation.search.label", { ns: "options" }),
  });
  await userEvent.type(search, "public");
  const input = await canvas.findByLabelText(
    i18n.t("fields.PublicName.label", { ns: "optionCatalog" }),
  );
  await userEvent.clear(input);
  await userEvent.type(input, "Riverside Cooperative");
  const description = canvas.getByLabelText(
    i18n.t("fields.PublicDescription.label", { ns: "optionCatalog" }),
  );
  await userEvent.clear(description);
  await userEvent.type(
    description,
    "Cooperative survival. New survivors welcome. Weekly supply runs from Riverside.",
  );
  await expect(input).toHaveValue("Riverside Cooperative");
  const publicListing = canvas.getByRole("switch", {
    // Highlighted label fragments can lose their separating whitespace.
    name: (name) =>
      name.replace(/\s/g, "") ===
      i18n.t("fields.Public.label", { ns: "optionCatalog" }).replace(/\s/g, ""),
  });
  await userEvent.click(publicListing);
  await expect(publicListing).toBeChecked();
  await expect(
    canvas.getByRole("button", { name: i18n.t("actions.saveChanges") }),
  ).toBeEnabled();
}

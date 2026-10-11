import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";

export async function preparePlayersShowcase(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  // Selection clicks must settle in order before opening the bulk menu.
  /* eslint-disable no-await-in-loop */
  for (const username of ["sawyer", "hurley"]) {
    const checkbox = await canvas.findByRole("checkbox", {
      name: i18n.t("selection.selectPlayer", { ns: "players", username }),
    });
    if (checkbox instanceof HTMLInputElement && !checkbox.checked)
      await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  }
  /* eslint-enable no-await-in-loop */
  const toolbar = await canvas.findByRole("toolbar");
  await userEvent.click(
    within(toolbar).getByRole("button", { name: i18n.t("actions.label") }),
  );
  const menu = await within(document.body).findByRole(
    "menu",
    {},
    { timeout: 10_000 },
  );
  await waitFor(() => expect(menu).toBeVisible(), { timeout: 10_000 });
  await expect(canvas.getAllByRole("row")).toHaveLength(10);
}

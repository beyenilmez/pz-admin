import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";
import { loadSkillCatalog } from "@/features/skills/catalog";
import type { GameBuild } from "@/features/game/types";

export async function prepareXpSelection(
  element: HTMLElement,
  build: GameBuild,
) {
  const dialog = within(element);
  const catalog = await loadSkillCatalog(build, i18n.language);
  const number = new Intl.NumberFormat(i18n.language);
  // Each skill must be selected before its level controls exist.
  /* eslint-disable no-await-in-loop */
  for (const [id, levelCount] of [
    ["Woodwork", 3],
    ["Doctor", 2],
  ] as const) {
    const skill = catalog.skillsById.get(id)!;
    await userEvent.click(
      await dialog.findByRole("button", { name: skill.name }),
    );
    const progression = catalog.progressions.get(skill.progressionId)!;
    for (const level of progression.levels.slice(0, levelCount)) {
      const button = dialog.getByRole("button", {
        name: i18n.t("picker.level.label", {
          ns: "skills",
          skill: skill.name,
          level: level.level,
          amount: number.format(level.xp),
        }),
      });
      await userEvent.click(button);
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
  }
  /* eslint-enable no-await-in-loop */
  const mechanics = catalog.skillsById.get("Mechanics")!;
  await userEvent.click(dialog.getByRole("button", { name: mechanics.name }));
  await userEvent.click(
    within(dialog.getByRole("group", { name: mechanics.name })).getByRole(
      "switch",
    ),
  );
  const customXp = dialog.getByRole("textbox", {
    name: i18n.t("picker.customXp.input.label", {
      ns: "skills",
      skill: mechanics.name,
    }),
  });
  await userEvent.type(customXp, "250");
  await expect(customXp).toHaveValue("250");
  await waitFor(() =>
    expect(
      dialog.getByRole("button", { name: i18n.t("actions.add") }),
    ).toBeEnabled(),
  );
  await userEvent.click(dialog.getByRole("heading"));
}

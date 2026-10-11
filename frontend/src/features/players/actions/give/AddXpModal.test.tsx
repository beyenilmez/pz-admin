import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Player, XPGrant } from "@bindings/internal/player/models";
import { useSkillCatalog } from "@/features/skills/hooks/useSkillCatalog";
import type { SkillCatalog } from "@/features/skills/types";
import i18n from "@/i18n";
import { fireEvent, render, screen, waitFor } from "@/test/render";
import { AddXpModal } from "./AddXpModal";

vi.mock("@/features/skills/hooks/useSkillCatalog", () => ({
  useSkillCatalog: vi.fn(),
}));

const aiming = {
  id: "Aiming",
  image: "/aiming.png",
  name: "Aiming",
  progressionId: "combat",
};
const fitness = {
  id: "Fitness",
  image: "/fitness.png",
  name: "Fitness",
  progressionId: "fitness",
};
const catalog = {
  build: "42",
  categories: [
    { id: "combat", name: "Combat", skills: [aiming] },
    { id: "physical", name: "Physical", skills: [fitness] },
  ],
  language: "en-US",
  progressions: new Map([
    [
      "combat",
      {
        id: "combat",
        levels: [
          { level: 1, totalXp: 120, xp: 120 },
          { level: 2, totalXp: 420, xp: 300 },
          { level: 3, totalXp: 1320, xp: 900 },
        ],
        maximumXp: 1320,
      },
    ],
    [
      "fitness",
      {
        id: "fitness",
        levels: [
          { level: 1, totalXp: 50, xp: 50 },
          { level: 2, totalXp: 250, xp: 200 },
        ],
        maximumXp: 250,
      },
    ],
  ]),
  skills: [aiming, fitness],
  skillsById: new Map([
    [aiming.id, aiming],
    [fitness.id, fitness],
  ]),
} satisfies SkillCatalog;

const players = [
  new Player({ id: "alice", username: "Alice" }),
  new Player({ id: "bob", username: "Bob" }),
];

function submitButton() {
  return screen.getByRole("button", {
    name: i18n.t("actions.add", { ns: "common" }),
  });
}

function levelButton(skill: string, level: number, amount: number) {
  return screen.getByRole("button", {
    name: i18n.t("picker.level.label", {
      amount: new Intl.NumberFormat(catalog.language).format(amount),
      level,
      ns: "skills",
      skill,
    }),
  });
}

interface AddXpProps {
  onAdd: (targets: Player[], grants: XPGrant[]) => Promise<boolean>;
}

beforeEach(() => {
  vi.mocked(useSkillCatalog).mockReturnValue({
    catalog,
    error: null,
    loading: false,
    reload: vi.fn(),
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("AddXpModal", () => {
  it("sums selected progression XP and excludes empty grants", async () => {
    const onAdd = vi.fn<AddXpProps["onAdd"]>().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <AddXpModal
        build="42"
        onAdd={onAdd}
        onClose={onClose}
        opened
        players={players}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: aiming.name }));
    fireEvent.click(screen.getByRole("button", { name: fitness.name }));
    const firstLevel = levelButton(aiming.name, 1, 120);
    const thirdLevel = levelButton(aiming.name, 3, 900);
    fireEvent.click(firstLevel);
    fireEvent.click(thirdLevel);
    fireEvent.click(submitButton());

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    const [submittedTargets, submittedGrants] = onAdd.mock.calls[0];
    expect(submittedTargets.map((target) => target.id)).toEqual([
      "alice",
      "bob",
    ]);
    expect(submittedGrants).toEqual([
      new XPGrant({ amount: 1020, perk: aiming.id }),
    ]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("submits a positive custom amount and closes on success", async () => {
    const onAdd = vi.fn<AddXpProps["onAdd"]>().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <AddXpModal
        build="42"
        onAdd={onAdd}
        onClose={onClose}
        opened
        players={players}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: fitness.name }));
    fireEvent.click(
      screen.getByLabelText(
        i18n.t("picker.customXp.toggle.label", { ns: "skills" }),
      ),
    );
    const customAmount = screen.getByLabelText(
      i18n.t("picker.customXp.input.label", {
        ns: "skills",
        skill: fitness.name,
      }),
    );

    fireEvent.change(customAmount, { target: { value: "475" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    const [submittedTargets, submittedGrants] = onAdd.mock.calls[0];
    expect(submittedTargets.map((target) => target.id)).toEqual([
      "alice",
      "bob",
    ]);
    expect(submittedGrants).toEqual([
      new XPGrant({ amount: 475, perk: fitness.id }),
    ]);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { XPGrant, type Player } from "@bindings/internal/player/models";
import { SkillXpPicker } from "@/features/skills/components/SkillXpPicker";
import { GameCreditsScrollArea } from "@/features/game/components/GameCreditsScrollArea";
import type { GameBuild } from "@/features/game/types";
import { useSkillCatalog } from "@/features/skills/hooks/useSkillCatalog";
import { useSkillXpSelection } from "@/features/skills/hooks/useSkillXpSelection";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import { SelectionDialogViewport } from "@/shared/layout/SelectionDialogViewport";
import {
  dialogBrowserViewportHeight,
  dialogSizes,
} from "@/shared/layout/dialogs";

interface AddXpModalProps {
  build: GameBuild;
  onAdd: (players: Player[], grants: XPGrant[]) => Promise<boolean>;
  onClose: () => void;
  opened: boolean;
  players: Player[];
}

export function AddXpModal({
  build,
  onAdd,
  onClose,
  opened,
  players,
}: AddXpModalProps) {
  const { i18n, t } = useTranslation(["players", "common"]);
  const { t: skillT } = useTranslation("skills");
  const language = i18n.language;
  const { catalog, error, loading, reload } = useSkillCatalog(build, language);
  const skeleton = useSkeletonVisibility(loading || !catalog);
  const selection = useSkillXpSelection();
  const [submitting, setSubmitting] = useState(false);
  const grants = useMemo(() => {
    if (!catalog) return [];

    return catalog.skills.flatMap((skill) => {
      const choice = selection.selection.get(skill.id);
      const progression = catalog.progressions.get(skill.progressionId);
      if (!choice || !progression) return [];

      const amount =
        choice.mode === "custom"
          ? (choice.amount ?? 0)
          : progression.levels.reduce(
              (total, level) =>
                choice.levels.has(level.level) ? total + level.xp : total,
              0,
            );
      return amount > 0 ? [new XPGrant({ amount, perk: skill.id })] : [];
    });
  }, [catalog, selection.selection]);

  function selectMaximumXp() {
    if (!catalog) return;

    selection.replace(
      new Map(
        catalog.skills.map((skill) => {
          const progression = catalog.progressions.get(skill.progressionId);
          return [
            skill.id,
            {
              levels: new Set(
                progression?.levels.map((level) => level.level) ?? [],
              ),
              mode: "levels" as const,
            },
          ] as const;
        }),
      ),
    );
  }

  async function handleAdd() {
    if (grants.length === 0) return;
    setSubmitting(true);
    try {
      if (await onAdd(players, grants)) onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      scrollAreaComponent={GameCreditsScrollArea}
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      onClose={onClose}
      onExitTransitionEnd={selection.clear}
      opened={opened}
      size={dialogSizes.browser}
      title={t("dialogs.addXp.title")}
      withCloseButton={!submitting}
    >
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          {t("dialogs.addXp.description", {
            count: players.length,
            username: players[0]?.username,
          })}
        </Text>

        {error ? (
          <Alert
            aria-live="polite"
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={skillT("errors.load.title")}
          >
            <Stack align="flex-start" gap="xs">
              <Text size="sm">{error}</Text>
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : skeleton.active ? (
          <Stack gap="sm" h={dialogBrowserViewportHeight} aria-busy="true">
            {skeleton.visible ? (
              <Group align="stretch" grow>
                <Skeleton h="100%" />
                <Skeleton h="100%" />
              </Group>
            ) : null}
          </Stack>
        ) : catalog ? (
          <SelectionDialogViewport>
            <SkillXpPicker catalog={catalog} selection={selection} />
          </SelectionDialogViewport>
        ) : null}

        <Group justify="space-between" pb="md">
          <Button
            disabled={!catalog || submitting}
            onClick={selectMaximumXp}
            variant="default"
          >
            {skillT("picker.actions.maxAll")}
          </Button>
          <Group>
            <Button disabled={submitting} onClick={onClose} variant="default">
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button
              disabled={grants.length === 0}
              loading={submitting}
              onClick={() => void handleAdd()}
            >
              {t("actions.add", { ns: "common" })}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}

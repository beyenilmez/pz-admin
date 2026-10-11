import { memo } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Stack,
  Switch,
  Text,
  VisuallyHidden,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type {
  SkillCatalogEntry,
  SkillProgression,
} from "@/features/skills/types";
import type { SkillXpChoice } from "@/features/skills/hooks/useSkillXpSelection";
import classes from "./SkillXpPicker.module.css";

interface SelectedSkillProps {
  choice: SkillXpChoice;
  formatCompactNumber: (value: number) => string;
  formatNumber: (value: number) => string;
  onCustomAmountChange: (skillId: string, amount: number | null) => void;
  onRemove: (skillId: string) => void;
  onSetMode: (skillId: string, mode: SkillXpChoice["mode"]) => void;
  onToggleLevel: (skillId: string, level: number) => void;
  progression: SkillProgression;
  skill: SkillCatalogEntry;
}

export const SelectedSkill = memo(function SelectedSkill({
  choice,
  formatCompactNumber,
  formatNumber,
  onCustomAmountChange,
  onRemove,
  onSetMode,
  onToggleLevel,
  progression,
  skill,
}: SelectedSkillProps) {
  const { t } = useTranslation("skills");
  const total =
    choice.mode === "custom"
      ? (choice.amount ?? 0)
      : progression.levels.reduce(
          (sum, level) =>
            choice.levels.has(level.level) ? sum + level.xp : sum,
          0,
        );

  return (
    <Box className={classes.selectedSkill}>
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Group gap="xs" wrap="nowrap" miw={0}>
          <img alt="" className={classes.skillIcon} src={skill.image} />
          <Text className={classes.skillName} fw={500} size="sm">
            {skill.name}
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap">
          <Text c="dimmed" size="xs" style={{ whiteSpace: "nowrap" }}>
            {t("picker.summary.total", { amount: formatNumber(total) })}
          </Text>
          <ActionIcon
            aria-label={t("picker.actions.removeSkill", { skill: skill.name })}
            color="gray"
            onClick={() => onRemove(skill.id)}
            size="sm"
            variant="subtle"
          >
            <IconX aria-hidden="true" size={14} />
          </ActionIcon>
        </Group>
      </Group>

      {choice.mode === "custom" ? (
        <Group align="flex-end" gap="sm" justify="space-between" wrap="nowrap">
          <NumberInput
            allowDecimal={false}
            allowNegative={false}
            aria-label={t("picker.customXp.input.label", {
              skill: skill.name,
            })}
            hideControls
            max={Number.MAX_SAFE_INTEGER}
            min={1}
            onChange={(value) =>
              onCustomAmountChange(
                skill.id,
                typeof value === "number" &&
                  Number.isInteger(value) &&
                  value > 0
                  ? value
                  : null,
              )
            }
            placeholder={t("picker.customXp.input.placeholder")}
            size="xs"
            value={choice.amount ?? ""}
            w={180}
          />
          <Switch
            checked
            label={t("picker.customXp.toggle.label")}
            onChange={() => onSetMode(skill.id, "levels")}
            size="xs"
          />
        </Group>
      ) : (
        <Group
          align="flex-end"
          component="fieldset"
          gap={4}
          m={0}
          p={0}
          style={{ border: 0 }}
        >
          <VisuallyHidden component="legend">{skill.name}</VisuallyHidden>
          {progression.levels.map((level) => {
            const selected = choice.levels.has(level.level);
            return (
              <Button
                aria-label={t("picker.level.label", {
                  amount: formatNumber(level.xp),
                  level: level.level,
                  skill: skill.name,
                })}
                aria-pressed={selected}
                className={classes.levelButton}
                data-selected={selected || undefined}
                h={36}
                key={level.level}
                onClick={() => onToggleLevel(skill.id, level.level)}
                px={6}
                size="compact-xs"
                variant={selected ? "filled" : "default"}
              >
                <Stack align="center" gap={0}>
                  <Text className={classes.levelLabel} fz={9} lh={1}>
                    {t("picker.level.short", { level: level.level })}
                  </Text>
                  <Text fz="xs" lh={1.2}>
                    +{formatCompactNumber(level.xp)}
                  </Text>
                </Stack>
              </Button>
            );
          })}
          <Switch
            checked={false}
            label={t("picker.customXp.toggle.label")}
            ml="auto"
            onChange={() => onSetMode(skill.id, "custom")}
            size="xs"
          />
        </Group>
      )}
    </Box>
  );
});

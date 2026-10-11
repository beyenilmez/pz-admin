import { useEffect, useRef } from "react";
import { Button, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { SkillCatalog, SkillCatalogEntry } from "@/features/skills/types";
import type { SkillXpSelectionController } from "@/features/skills/hooks/useSkillXpSelection";
import { SelectedSkill } from "./SelectedSkill";
import classes from "./SkillXpPicker.module.css";

interface SelectedSkillsPaneProps {
  catalog: SkillCatalog;
  formatCompactNumber: (value: number) => string;
  formatNumber: (value: number) => string;
  selectedSkills: SkillCatalogEntry[];
  selection: SkillXpSelectionController;
}

export function SelectedSkillsPane({
  catalog,
  formatCompactNumber,
  formatNumber,
  selectedSkills,
  selection,
}: SelectedSkillsPaneProps) {
  const { t } = useTranslation("skills");
  const scrollRegionRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const previousCount = useRef(selectedSkills.length);

  useEffect(() => {
    const skillAdded = selectedSkills.length > previousCount.current;
    previousCount.current = selectedSkills.length;
    if (!skillAdded || !wasAtBottom.current) return;

    const scrollRegion = scrollRegionRef.current;
    scrollRegion?.scrollTo({
      behavior: "smooth",
      top: scrollRegion.scrollHeight,
    });
  }, [selectedSkills.length]);

  return (
    <Paper className={classes.pane} component={Stack} gap={0} withBorder>
      <Group justify="space-between" px="sm" py="xs">
        <Text fw={600} size="sm">
          {t("picker.selection.heading", { count: selectedSkills.length })}
        </Text>
        <Button
          color="gray"
          disabled={selectedSkills.length === 0}
          onClick={selection.clear}
          size="compact-xs"
          variant="subtle"
        >
          {t("actions.clearAll", { ns: "common" })}
        </Button>
      </Group>

      <ScrollArea
        className={classes.scrollRegion}
        offsetScrollbars="y"
        onScrollPositionChange={() => {
          const region = scrollRegionRef.current;
          if (region) {
            wasAtBottom.current =
              region.scrollHeight - region.scrollTop - region.clientHeight <= 1;
          }
        }}
        overscrollBehavior="contain"
        scrollbarSize={10}
        scrollbars="y"
        type="auto"
        viewportRef={scrollRegionRef}
      >
        {selectedSkills.length > 0 ? (
          selectedSkills.map((skill) => {
            const progression = catalog.progressions.get(skill.progressionId);
            const choice = selection.selection.get(skill.id);
            if (!progression || !choice) return null;

            return (
              <SelectedSkill
                choice={choice}
                formatCompactNumber={formatCompactNumber}
                formatNumber={formatNumber}
                key={skill.id}
                onCustomAmountChange={selection.setCustomAmount}
                onRemove={selection.remove}
                onSetMode={selection.setMode}
                onToggleLevel={selection.toggleLevel}
                progression={progression}
                skill={skill}
              />
            );
          })
        ) : (
          <Text c="dimmed" p="xl" size="sm" ta="center">
            {t("picker.selection.empty")}
          </Text>
        )}
      </ScrollArea>
    </Paper>
  );
}

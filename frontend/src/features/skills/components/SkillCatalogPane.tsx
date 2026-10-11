import {
  Box,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { SkillCatalog } from "@/features/skills/types";
import type { SkillXpSelectionController } from "@/features/skills/hooks/useSkillXpSelection";
import classes from "./SkillXpPicker.module.css";

interface SkillCatalogPaneProps {
  catalog: SkillCatalog;
  selection: SkillXpSelectionController;
}

export function SkillCatalogPane({
  catalog,
  selection,
}: SkillCatalogPaneProps) {
  const { t } = useTranslation("skills");

  return (
    <Paper className={classes.pane} component={Stack} gap={0} withBorder>
      <Text fw={600} px="sm" py="xs" size="sm">
        {t("picker.catalog.heading")}
      </Text>
      <ScrollArea
        className={classes.scrollRegion}
        offsetScrollbars="y"
        scrollbarSize={10}
        scrollbars="y"
        type="auto"
      >
        <Stack gap="sm" p="xs">
          {catalog.categories.map((category) => (
            <Box key={category.id}>
              <Text c="dimmed" fw={600} mb={3} px={5} size="xs">
                {category.name}
              </Text>
              <SimpleGrid cols={2} spacing={2} verticalSpacing={2}>
                {category.skills.map((skill) => {
                  const selected = selection.selection.has(skill.id);
                  return (
                    <UnstyledButton
                      aria-pressed={selected}
                      className={classes.skillButton}
                      data-selected={selected || undefined}
                      key={skill.id}
                      onClick={() => selection.toggleSkill(skill.id)}
                    >
                      <img
                        alt=""
                        className={classes.skillIcon}
                        src={skill.image}
                      />
                      <Text className={classes.skillName} fw={500} size="xs">
                        {skill.name}
                      </Text>
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}

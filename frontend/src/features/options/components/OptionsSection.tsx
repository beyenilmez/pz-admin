import { Paper, Stack, Title } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { GameBuild } from "@/features/game/types";
import type { OptionCategory, OptionSection } from "../catalog";
import { useOptionTranslations } from "../hooks/useOptionTranslations";
import type { OptionFormValues } from "../lib/optionValues";
import { OptionField } from "./OptionField";
import { OptionSearchHighlight } from "./OptionSearchHighlight";

interface OptionsSectionProps {
  build: GameBuild;
  category: OptionCategory;
  form: UseFormReturnType<OptionFormValues>;
  highlight?: string;
  section: OptionSection;
  showCategory: boolean;
}

export function OptionsSection({
  build,
  category,
  form,
  highlight,
  section,
  showCategory,
}: OptionsSectionProps) {
  const labels = useOptionTranslations();

  return (
    <Stack gap="sm">
      <div>
        {showCategory ? (
          <Title order={2} size="h3" mb={2}>
            <OptionSearchHighlight query={highlight}>
              {labels.categoryLabel(category.id)}
            </OptionSearchHighlight>
          </Title>
        ) : null}
        <Title order={3} size="h4">
          <OptionSearchHighlight query={highlight}>
            {labels.sectionLabel(section.id)}
          </OptionSearchHighlight>
        </Title>
      </div>

      <Paper withBorder>
        {section.options.map((definition) => (
          <OptionField
            build={build}
            key={definition.name}
            definition={definition}
            form={form}
            highlight={highlight}
          />
        ))}
      </Paper>
    </Stack>
  );
}

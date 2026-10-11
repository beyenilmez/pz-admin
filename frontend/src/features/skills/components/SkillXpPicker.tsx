import { useMemo } from "react";
import { SelectionWorkspace } from "@/shared/layout/SelectionWorkspace";
import type { SkillCatalog } from "@/features/skills/types";
import type { SkillXpSelectionController } from "@/features/skills/hooks/useSkillXpSelection";
import { SelectedSkillsPane } from "./SelectedSkillsPane";
import { SkillCatalogPane } from "./SkillCatalogPane";

interface SkillXpPickerProps {
  catalog: SkillCatalog;
  selection: SkillXpSelectionController;
}

export function SkillXpPicker({ catalog, selection }: SkillXpPickerProps) {
  const numberFormats = useMemo(() => {
    const compactFormatter = new Intl.NumberFormat(catalog.language, {
      maximumFractionDigits: 1,
      notation: "compact",
    });
    const standardFormatter = new Intl.NumberFormat(catalog.language);

    return {
      compact: (value: number) => compactFormatter.format(value),
      standard: (value: number) => standardFormatter.format(value),
    };
  }, [catalog.language]);
  const selectedSkills = Array.from(selection.selection.keys()).flatMap(
    (skillId) => {
      const skill = catalog.skillsById.get(skillId);
      return skill ? [skill] : [];
    },
  );

  return (
    <SelectionWorkspace layout="skills">
      <SkillCatalogPane catalog={catalog} selection={selection} />
      <SelectedSkillsPane
        catalog={catalog}
        formatCompactNumber={numberFormats.compact}
        formatNumber={numberFormats.standard}
        selectedSkills={selectedSkills}
        selection={selection}
      />
    </SelectionWorkspace>
  );
}

import { Button, Group, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OptionDefinition } from "../catalog";
import { optionValuesEqual, type OptionFormValues } from "../lib/optionValues";
import { validateOptionValues } from "../lib/validation";

interface OptionsActionsProps {
  definitions: readonly OptionDefinition[];
  form: UseFormReturnType<OptionFormValues>;
  onReset: () => void;
  saving: boolean;
}

export function OptionsActions({
  definitions,
  form,
  onReset,
  saving,
}: OptionsActionsProps) {
  const { t } = useTranslation(["options", "common"]);
  const initialValues = form.getInitialValues();
  const dirtyCount = definitions.reduce(
    (count, definition) =>
      count +
      Number(
        !optionValuesEqual(
          form.values[definition.name],
          initialValues[definition.name],
        ),
      ),
    0,
  );
  const invalid =
    Object.keys(validateOptionValues(definitions, form.values)).length > 0;

  return (
    <>
      <Text c="dimmed" size="sm">
        {t("changes.unsaved", { count: dirtyCount })}
      </Text>
      <Group gap="sm" ml="auto">
        <Button
          disabled={dirtyCount === 0 || saving}
          variant="default"
          onClick={onReset}
        >
          {t("actions.reset", { ns: "common" })}
        </Button>
        <Button
          disabled={dirtyCount === 0 || invalid}
          leftSection={<IconDeviceFloppy size={16} aria-hidden="true" />}
          loading={saving}
          type="submit"
        >
          {t("actions.saveChanges", { ns: "common" })}
        </Button>
      </Group>
    </>
  );
}

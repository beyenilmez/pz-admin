import { useId } from "react";
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconRestore } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import type { OptionDefinition, ScalarOptionValue } from "../catalog";
import { useOptionTranslations } from "../hooks/useOptionTranslations";
import {
  optionValuesEqual,
  type OptionFormValue,
  type OptionFormValues,
} from "../lib/optionValues";
import type { OptionValidationIssue } from "../lib/validation";
import { validateOptionValue } from "../lib/validation";
import classes from "./OptionField.module.css";
import { OptionControl, optionControlSize } from "./OptionControl";
import { OptionSearchHighlight } from "./OptionSearchHighlight";
import { SpecialValueControl } from "./SpecialValueControl";

interface OptionFieldProps {
  build: GameBuild;
  definition: OptionDefinition;
  form: UseFormReturnType<OptionFormValues>;
  highlight?: string;
}

function expectedValueLabel(
  value: ScalarOptionValue,
  enabled: string,
  disabled: string,
) {
  if (value === true) return enabled;
  if (value === false) return disabled;
  return String(value);
}

export function OptionField({
  build,
  definition,
  form,
  highlight,
}: OptionFieldProps) {
  const id = useId();
  const { t } = useTranslation("options");
  const labels = useOptionTranslations();
  const label = labels.fieldLabel(definition.name);
  const description = labels.fieldDescription(definition.name);
  const values = form.values;
  const value = values[definition.name];
  const specialActive =
    definition.specialValue !== undefined &&
    value === definition.specialValue.value;
  const validationIssue: OptionValidationIssue | undefined =
    validateOptionValue(definition, values);
  const validationError = validationIssue
    ? t(`validation.${validationIssue.type}`, {
        value: "value" in validationIssue ? validationIssue.value : undefined,
      })
    : null;
  const error = form.errors[definition.name] ?? validationError;
  const unmet = (definition.requirements ?? []).filter(
    (requirement) => values[requirement.option] !== requirement.equals,
  );
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const canRestoreDefault =
    !definition.readOnly &&
    !definition.dynamicDefault &&
    definition.defaultValue !== undefined &&
    !optionValuesEqual(value, definition.defaultValue);
  const setValue = (nextValue: OptionFormValue) => {
    form.setFieldValue(definition.name, nextValue);
    if (form.errors[definition.name]) {
      form.clearFieldError(definition.name);
    }
  };
  const restoreCatalogDefault = () => {
    const defaultValue = definition.defaultValue;
    if (defaultValue === undefined) return;

    form.setFieldValue(
      definition.name,
      Array.isArray(defaultValue) ? [...defaultValue] : defaultValue,
    );
    form.clearFieldError(definition.name);
  };

  let control = (
    <OptionControl
      build={build}
      definition={definition}
      descriptionId={descriptionId}
      disabled={definition.readOnly || specialActive}
      error={error}
      inputId={id}
      labelId={labelId}
      onChange={setValue}
      value={value}
    />
  );

  if (definition.specialValue) {
    control = (
      <SpecialValueControl
        definition={definition}
        onChange={setValue}
        specialValue={definition.specialValue}
        value={value}
      >
        {control}
      </SpecialValueControl>
    );
  }

  return (
    <div className={classes.root} data-inactive={unmet.length > 0 || undefined}>
      <Stack id={descriptionId} gap={3} className={classes.details}>
        <Group gap="xs" wrap="nowrap">
          <Text id={labelId} fw={500} size="sm">
            <OptionSearchHighlight query={highlight}>
              {label}
            </OptionSearchHighlight>
          </Text>
          {canRestoreDefault ? (
            <Tooltip label={t("actions.restoreDefault", { ns: "common" })}>
              <ActionIcon
                aria-label={t("actions.restoreDefault", { ns: "common" })}
                color="gray"
                onClick={restoreCatalogDefault}
                size="xs"
                variant="subtle"
              >
                <IconRestore size={13} aria-hidden="true" />
              </ActionIcon>
            </Tooltip>
          ) : null}
          {definition.writeOnly ? (
            <Tooltip label={t("field.writeOnly.description")}>
              <Badge color="gray" size="xs" variant="light">
                {t("field.writeOnly.label")}
              </Badge>
            </Tooltip>
          ) : null}
        </Group>
        {description ? (
          <Text c="dimmed" size="xs">
            <OptionSearchHighlight query={highlight}>
              {description}
            </OptionSearchHighlight>
          </Text>
        ) : null}
        {unmet.map((requirement) => (
          <Text key={requirement.option} size="xs" c="dimmed">
            {t("field.requirement", {
              option: labels.fieldLabel(requirement.option),
              value: expectedValueLabel(
                requirement.equals,
                t("values.enabled"),
                t("values.disabled"),
              ),
            })}
          </Text>
        ))}
        {error ? (
          <Text c="red" size="xs" role="alert">
            {error}
          </Text>
        ) : null}
      </Stack>
      <div
        className={classes.control}
        data-size={optionControlSize(definition)}
        data-special={definition.specialValue ? true : undefined}
      >
        {control}
      </div>
    </div>
  );
}

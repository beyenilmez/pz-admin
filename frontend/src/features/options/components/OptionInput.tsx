import type { ReactNode } from "react";
import {
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { OptionDefinition } from "../catalog";
import { useOptionTranslations } from "../hooks/useOptionTranslations";
import { formatServerValue, type OptionFormValue } from "../lib/optionValues";

export interface OptionInputProps {
  definition: OptionDefinition;
  descriptionId: string;
  disabled: boolean;
  error: ReactNode;
  inputId: string;
  labelId: string;
  onChange: (value: OptionFormValue) => void;
  value: OptionFormValue | undefined;
}

export function OptionInput({
  definition,
  descriptionId,
  disabled,
  error,
  inputId,
  labelId,
  onChange,
  value,
}: OptionInputProps) {
  const { t } = useTranslation("options");
  const labels = useOptionTranslations();
  const commonProps = {
    "aria-describedby": descriptionId,
    "aria-invalid": Boolean(error),
    "aria-labelledby": labelId,
    autoComplete: "off",
    disabled,
    id: inputId,
    name: definition.name,
  };

  if (definition.type === "boolean") {
    return (
      <Switch
        {...commonProps}
        checked={value === true}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    );
  }

  if (definition.choices && definition.multiple) {
    return (
      <MultiSelect
        {...commonProps}
        clearable
        data={definition.choices.map((choice) => ({
          label: labels.choiceLabel(
            definition.name,
            choice.id,
            choice.translationGroup,
          ),
          value: formatServerValue(choice.value),
        }))}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  if (definition.choices) {
    return (
      <Select
        {...commonProps}
        allowDeselect={false}
        data={definition.choices.map((choice) => ({
          label: labels.choiceLabel(
            definition.name,
            choice.id,
            choice.translationGroup,
          ),
          value: formatServerValue(choice.value),
        }))}
        value={value === undefined ? null : formatServerValue(value)}
        onChange={(selectedValue) => {
          const choice = definition.choices?.find(
            (candidate) => formatServerValue(candidate.value) === selectedValue,
          );
          if (choice) onChange(choice.value);
        }}
      />
    );
  }

  if (definition.type === "integer" || definition.type === "number") {
    // `Integer.MAX_VALUE` is an implementation ceiling, not useful user guidance.
    const displayedMaximum =
      definition.maximum === 2_147_483_647 ? undefined : definition.maximum;
    return (
      <Stack gap={2}>
        <NumberInput
          {...commonProps}
          allowDecimal={definition.type === "number"}
          clampBehavior="blur"
          max={definition.maximum}
          min={definition.minimum}
          value={
            typeof value === "number" || typeof value === "string" ? value : ""
          }
          onChange={onChange}
        />
        {definition.minimum !== undefined || displayedMaximum !== undefined ? (
          <Text
            aria-label={t("field.numericRange", {
              context:
                definition.minimum === undefined
                  ? "maximum"
                  : displayedMaximum === undefined
                    ? "minimum"
                    : undefined,
              maximum: displayedMaximum,
              minimum: definition.minimum,
            })}
            c="dimmed"
            size="xs"
            ta="center"
          >
            {definition.minimum !== undefined && displayedMaximum !== undefined
              ? `${definition.minimum}–${displayedMaximum}`
              : definition.minimum !== undefined
                ? `≥ ${definition.minimum}`
                : `≤ ${displayedMaximum}`}
          </Text>
        ) : null}
      </Stack>
    );
  }

  if (definition.type === "text") {
    // Generic multiline options use literal `\n`; specialized editors own
    // their serialization and therefore receive the value unchanged.
    const escapesLineBreaks = definition.editor === undefined;
    return (
      <Textarea
        {...commonProps}
        autosize
        maxLength={definition.maximumLength}
        maxRows={10}
        minRows={3}
        value={
          typeof value === "string" && escapesLineBreaks
            ? value.split("\\n").join("\n")
            : typeof value === "string"
              ? value
              : ""
        }
        onChange={(event) =>
          onChange(
            escapesLineBreaks
              ? event.currentTarget.value.split("\n").join("\\n")
              : event.currentTarget.value,
          )
        }
      />
    );
  }

  return (
    <TextInput
      {...commonProps}
      maxLength={definition.maximumLength}
      type={definition.secret ? "password" : "text"}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

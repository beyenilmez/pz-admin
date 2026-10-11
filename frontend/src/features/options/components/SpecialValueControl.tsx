import { useRef, type ReactNode } from "react";
import { Checkbox } from "@mantine/core";
import type {
  OptionDefinition,
  ScalarOptionValue,
  OptionSpecialValue,
} from "../catalog";
import { useOptionTranslations } from "../hooks/useOptionTranslations";
import type { OptionFormValue } from "../lib/optionValues";
import classes from "./OptionField.module.css";

interface SpecialValueControlProps {
  children: ReactNode;
  definition: OptionDefinition;
  onChange: (value: OptionFormValue) => void;
  specialValue: OptionSpecialValue;
  value: OptionFormValue | undefined;
}

function initialOrdinaryValue(definition: OptionDefinition): ScalarOptionValue {
  const special = definition.specialValue?.value;
  const defaultValue = definition.defaultValue;
  if (
    defaultValue !== undefined &&
    !Array.isArray(defaultValue) &&
    defaultValue !== special
  ) {
    return defaultValue;
  }
  if (definition.type === "integer" || definition.type === "number") {
    const minimum = definition.minimum ?? 0;
    if (minimum !== special) return minimum;
    return minimum + 1;
  }
  return "";
}

/** Keeps the user's ordinary value while a semantic sentinel is active. */
export function SpecialValueControl({
  children,
  definition,
  onChange,
  specialValue,
  value,
}: SpecialValueControlProps) {
  const labels = useOptionTranslations();
  const active = value === specialValue.value;
  const ordinaryValue = useRef<ScalarOptionValue | undefined>(
    active || Array.isArray(value) ? undefined : value,
  );
  if (!active && !Array.isArray(value)) ordinaryValue.current = value;

  return (
    <div className={classes.specialControl}>
      <Checkbox
        checked={active}
        classNames={{ label: classes.specialCheckboxLabel }}
        disabled={definition.readOnly}
        label={labels.specialValueLabel(specialValue.meaning)}
        onChange={(event) => {
          onChange(
            event.currentTarget.checked
              ? specialValue.value
              : (ordinaryValue.current ?? initialOrdinaryValue(definition)),
          );
        }}
        size="xs"
      />
      <div className={classes.specialValue}>{children}</div>
    </div>
  );
}

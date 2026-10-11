import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@mantine/form";
import { List, Update } from "@bindings/internal/options/service";
import type { UpdateResult } from "@bindings/internal/options/models";
import type {
  OptionCategory,
  OptionDefinition,
  OptionSection,
} from "../catalog";
import {
  createFormValues,
  formatServerValue,
  optionValuesEqual,
  type OptionFormValues,
} from "../lib/optionValues";
import { validateOptionValues } from "../lib/validation";

interface SaveOutcome {
  refreshed: boolean;
  result: UpdateResult;
}

function collectDefinitions(categories: readonly OptionCategory[]) {
  const definitions: OptionDefinition[] = [];
  for (const category of categories) {
    for (const section of category.sections) {
      definitions.push(...section.options);
    }
  }
  return definitions;
}

function supportedCategories(
  catalog: readonly OptionCategory[],
  serverValues: Record<string, string | undefined>,
) {
  const categories: OptionCategory[] = [];
  for (const category of catalog) {
    const sections: OptionSection[] = [];
    for (const section of category.sections) {
      const options = section.options.filter(
        (definition) =>
          definition.writeOnly || serverValues[definition.name] !== undefined,
      );
      if (options.length > 0) sections.push({ ...section, options });
    }
    if (sections.length > 0) categories.push({ ...category, sections });
  }
  return categories;
}

function prepareEditorData(
  catalog: readonly OptionCategory[],
  rawValues: Record<string, string | undefined>,
) {
  // `showoptions` decides what the connected server supports. Write-only
  // entries remain because the server accepts but does not return them.
  const categories = supportedCategories(catalog, rawValues);
  const definitions = collectDefinitions(categories);
  return {
    categories,
    definitions,
    values: createFormValues(definitions, rawValues),
  };
}

function collectChanges(
  definitions: readonly OptionDefinition[],
  values: OptionFormValues,
  initialValues: OptionFormValues,
) {
  const changes: Record<string, string> = {};
  for (const definition of definitions) {
    if (
      !optionValuesEqual(
        values[definition.name],
        initialValues[definition.name],
      )
    ) {
      changes[definition.name] = formatServerValue(values[definition.name]);
    }
  }
  return changes;
}

export function useOptionsEditor(
  catalog: readonly OptionCategory[],
  active: boolean,
) {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const wasActive = useRef(false);
  const definitions = useMemo(
    () => collectDefinitions(categories),
    [categories],
  );
  const form = useForm<OptionFormValues>({
    initialValues: {},
  });
  const { clearErrors, isDirty, resetDirty, setInitialValues, setValues } =
    form;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rawValues = await List();
      const loaded = prepareEditorData(catalog, rawValues);
      if (isDirty()) return;
      setCategories(loaded.categories);
      setInitialValues(loaded.values);
      setValues(loaded.values);
      resetDirty(loaded.values);
      clearErrors();
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [catalog, clearErrors, isDirty, resetDirty, setInitialValues, setValues]);

  useEffect(() => {
    const activated = active && !wasActive.current;
    wasActive.current = active;
    if (activated && !isDirty()) void load();
  }, [active, isDirty, load]);

  async function save(): Promise<SaveOutcome | null> {
    if (
      Object.keys(validateOptionValues(definitions, form.getValues())).length >
      0
    ) {
      return null;
    }
    const values = form.getValues();
    const changes = collectChanges(
      definitions,
      values,
      form.getInitialValues(),
    );
    if (Object.keys(changes).length === 0) return null;

    setSaving(true);
    form.clearErrors();
    try {
      const result = await Update(changes);
      let refreshed = false;
      try {
        const rawValues = await List();
        const loaded = prepareEditorData(catalog, rawValues);
        const displayedValues = { ...loaded.values };

        // Successful changes adopt the server value. Failed changes stay in
        // the form so the user can correct and retry them.
        for (const name of Object.keys(result.failed)) {
          displayedValues[name] = values[name];
        }
        setCategories(loaded.categories);
        form.setInitialValues(loaded.values);
        form.setValues(displayedValues);
        form.resetDirty(loaded.values);
        refreshed = true;
      } catch {
        // Keep local edits dirty when the authoritative state cannot be reloaded.
      }
      form.setErrors(result.failed);
      return { refreshed, result };
    } finally {
      setSaving(false);
    }
  }

  return {
    categories,
    definitions,
    form,
    load,
    loadError,
    loading,
    reset() {
      form.reset();
    },
    save,
    saving,
  };
}

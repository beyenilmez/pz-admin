import { Alert, Button, Group, Input, Stack, Switch } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { OpenWindow } from "@bindings/internal/logger/service";
import { useId, useState } from "react";
import { errorMessage } from "@/shared/lib/errors";
import { useAppConfig } from "@/features/config/AppConfigProvider";
import rowClasses from "./SettingRow.module.css";

export function LoggingControls() {
  const debugInputId = useId();
  const { t } = useTranslation("settings");
  const { config, loading, setDebugLogging } = useAppConfig();
  const [saving, setSaving] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  async function handleDebugLoggingChange(enabled: boolean) {
    setSaving(true);
    await setDebugLogging(enabled);
    setSaving(false);
  }

  async function handleOpenLogs() {
    setOpenError(null);
    try {
      await OpenWindow();
    } catch (cause) {
      setOpenError(errorMessage(cause));
    }
  }

  return (
    <Stack gap="xs">
      <Input.Wrapper
        classNames={rowClasses}
        id={debugInputId}
        label={t("logs.debug.label")}
        description={t("logs.debug.description")}
      >
        <Group className={rowClasses.control} gap="sm">
          <Switch
            id={debugInputId}
            name="debugLogging"
            aria-labelledby={`${debugInputId}-label`}
            aria-describedby={`${debugInputId}-description`}
            checked={config?.debugLogging ?? false}
            disabled={loading || !config || saving}
            onChange={(event) =>
              void handleDebugLoggingChange(event.currentTarget.checked)
            }
          />
          <Button variant="default" onClick={() => void handleOpenLogs()}>
            {t("logs.actions.open")}
          </Button>
        </Group>
      </Input.Wrapper>
      {openError && (
        <Alert color="red" title={t("logs.errors.open")}>
          {openError}
        </Alert>
      )}
    </Stack>
  );
}

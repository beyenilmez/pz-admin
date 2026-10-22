import { useEffect } from "react";
import { Alert, Button, Stack } from "@mantine/core";
import { Window } from "@wailsio/runtime";
import { useTranslation } from "react-i18next";
import { LogOutput } from "./components/LogOutput";
import { useLogEntries } from "./hooks/useLogEntries";
import classes from "./LogWindow.module.css";

export function LogWindow() {
  const { t } = useTranslation(["settings", "common"]);
  const logs = useLogEntries();

  useEffect(() => {
    void Window.SetTitle(`PZ Admin — ${t("logs.title")}`);
  }, [t]);

  return (
    <main className={classes.window}>
      {logs.error && (
        <Alert color="red" title={t("logs.errors.read")} mt="sm" mx="sm">
          <Stack align="flex-start" gap="xs">
            {logs.error}
            <Button size="xs" variant="light" onClick={logs.reload}>
              {t("actions.retry", { ns: "common" })}
            </Button>
          </Stack>
        </Alert>
      )}
      <LogOutput entries={logs.entries} loading={logs.loading} />
    </main>
  );
}

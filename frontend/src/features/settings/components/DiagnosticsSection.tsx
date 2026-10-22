import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Code,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { System } from "@wailsio/runtime";
import { Flatpak } from "@bindings/internal/diagnostics/service";
import { useTranslation } from "react-i18next";
import { errorMessage } from "@/shared/lib/errors";
import { CopyValueButton } from "@/shared/components/CopyValueButton";
import { formatDiagnostics } from "@/features/settings/lib/diagnostics";
import { LoggingControls } from "./LoggingControls";

export function DiagnosticsSection() {
  const { t } = useTranslation(["settings", "common"]);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [info, flatpak] = await Promise.all([
          System.Environment(),
          Flatpak(),
        ]);
        if (active) setReport(formatDiagnostics(info, flatpak));
      } catch (cause) {
        if (active) setError(errorMessage(cause));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <Stack gap="sm" mt="md">
      <Title order={2}>{t("diagnostics.title")}</Title>
      <Text c="dimmed" size="sm">
        {t("diagnostics.description")}
      </Text>
      {error ? (
        <Alert color="red" title={t("diagnostics.errors.load.title")}>
          <Stack align="flex-start" gap="xs">
            {error}
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                setError(null);
                setAttempt((value) => value + 1);
              }}
            >
              {t("actions.retry", { ns: "common" })}
            </Button>
          </Stack>
        </Alert>
      ) : report === null ? (
        <Skeleton height={160} />
      ) : (
        <Box pos="relative">
          <Code
            block
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              paddingInlineEnd: 56,
            }}
          >
            {report}
          </Code>
          <Box pos="absolute" top={8} style={{ insetInlineEnd: 8 }}>
            <CopyValueButton
              variant="subtle"
              value={report}
              copyLabel={t("actions.copy", { ns: "common" })}
              copiedLabel={t("actions.copied", { ns: "common" })}
            />
          </Box>
        </Box>
      )}
      <LoggingControls />
    </Stack>
  );
}

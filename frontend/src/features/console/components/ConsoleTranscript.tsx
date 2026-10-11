import { useEffect, useRef } from "react";
import { Box, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ConsoleEntry } from "@/features/console/types";
import classes from "../ConsolePage.module.css";

interface ConsoleTranscriptProps {
  entries: ConsoleEntry[];
}

export function ConsoleTranscript({ entries }: ConsoleTranscriptProps) {
  const { t } = useTranslation("console");
  const viewportRef = useRef<HTMLDivElement>(null);
  const followLatestOutputRef = useRef(true);

  useEffect(() => {
    if (entries.length === 0) followLatestOutputRef.current = true;
    if (viewportRef.current && followLatestOutputRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <Box
      ref={viewportRef}
      className={classes.transcript}
      role="log"
      aria-live="polite"
      aria-label={t("output.label")}
      onScroll={(event) => {
        const element = event.currentTarget;
        followLatestOutputRef.current =
          element.scrollHeight - element.scrollTop - element.clientHeight <= 24;
      }}
    >
      {entries.length === 0 ? (
        <Box className={classes.emptyMessage}>
          <Text size="sm">{t("introduction.welcome")}</Text>
          <Text c="dimmed" size="sm">
            {t("introduction.usage")}
          </Text>
        </Box>
      ) : (
        entries.map((entry) => (
          <Box
            key={entry.id}
            className={classes.entry}
            data-status={entry.status}
          >
            <Text component="div" className={classes.command}>
              <Text component="span" className={classes.prompt} inherit>
                {">"}{" "}
              </Text>
              {entry.command}
            </Text>
            {entry.status === "pending" ? null : (
              <Text
                component="pre"
                className={classes.result}
                data-empty={entry.result ? undefined : true}
              >
                {entry.result || t("output.empty")}
              </Text>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}

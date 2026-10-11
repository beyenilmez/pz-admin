import { useRef, useState } from "react";
import { Paper } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Execute } from "@bindings/internal/console/service";
import { PageContainer } from "@/shared/layout/PageContainer";
import { clearConsoleCommand } from "@/features/console/lib/catalog";
import type { ConsoleEntry } from "@/features/console/types";
import { rootErrorMessage } from "@/shared/lib/errors";
import { ConsoleInput } from "./components/ConsoleInput";
import { ConsoleTranscript } from "./components/ConsoleTranscript";
import classes from "./ConsolePage.module.css";

export function ConsolePage() {
  const { t } = useTranslation("console");
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [executing, setExecuting] = useState(false);
  const nextEntryId = useRef(0);

  async function handleExecute(command: string) {
    const commandParts = command.toLowerCase().split(/\s+/);
    if (commandParts.length === 1 && commandParts[0] === clearConsoleCommand) {
      setEntries([]);
      return;
    }

    if (
      commandParts.length === 2 &&
      commandParts[0] === "help" &&
      commandParts[1] === clearConsoleCommand
    ) {
      setEntries((current) => [
        ...current,
        {
          command,
          id: nextEntryId.current++,
          result: t("help.cls"),
          status: "success",
        },
      ]);
      return;
    }

    const entryId = nextEntryId.current++;
    setExecuting(true);
    setEntries((current) => [
      ...current,
      { command, id: entryId, status: "pending" },
    ]);

    try {
      const result = await Execute(command);
      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, result, status: "success" }
            : entry,
        ),
      );
    } catch (error) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, result: rootErrorMessage(error), status: "error" }
            : entry,
        ),
      );
    } finally {
      setExecuting(false);
    }
  }

  return (
    <PageContainer contentWidth="fluid" p={0} h="100%" className={classes.page}>
      <Paper className={classes.console} aria-busy={executing}>
        <ConsoleTranscript entries={entries} />
        <ConsoleInput executing={executing} onExecute={handleExecute} />
      </Paper>
    </PageContainer>
  );
}

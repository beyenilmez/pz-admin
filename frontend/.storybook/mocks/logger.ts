import { fn } from "storybook/test";
import { Entry, Update } from "@bindings/internal/logger/models";

export const OpenWindow = fn(async () => {});
const entries = [
  'time=2026-10-20T12:00:00Z level=INFO msg="application started" version=2.0.0',
  'time=2026-10-20T12:00:01Z level=INFO msg="connected to server"',
  'time=2026-10-20T12:00:04Z level=WARN msg="RCON request timed out" command=players',
  'time=2026-10-20T12:00:05Z level=ERROR msg="server connection lost"',
].map(
  (text, i) =>
    new Entry({
      id: i + 1,
      text,
      level: text.includes("level=WARN")
        ? "WARN"
        : text.includes("level=ERROR")
          ? "ERROR"
          : "INFO",
    }),
);
entries.push(
  new Entry({
    id: entries.length + 1,
    text: 'time=2026-10-20T12:00:06Z level=DEBUG msg="received server response" command=players detail="Alice, Bob, Charlie,',
    level: "DEBUG",
    truncated: true,
  }),
);
export const Read = fn(
  async (afterID: number) =>
    new Update({
      entries: entries.filter((entry) => entry.id > afterID),
      firstID: 1,
    }),
);

export const ReportFrontendError = fn(async () => {});

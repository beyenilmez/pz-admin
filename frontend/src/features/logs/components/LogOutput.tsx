import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { Code, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Entry } from "@bindings/internal/logger/models";
import { CopyValueButton } from "@/shared/components/CopyValueButton";
import classes from "./LogOutput.module.css";

interface LogOutputProps {
  entries: readonly Entry[];
  loading: boolean;
}

export const LogOutput = memo(function LogOutput({
  entries,
  loading,
}: LogOutputProps) {
  const { t } = useTranslation(["settings", "common"]);
  const viewport = useRef<HTMLElement>(null);
  const following = useRef(true);
  const truncatedSuffix = ` ${t("logs.output.truncated")}`;
  const copyText = useMemo(
    () =>
      entries
        .map((entry) => entry.text + (entry.truncated ? truncatedSuffix : ""))
        .join("\n"),
    [entries, truncatedSuffix],
  );

  useLayoutEffect(() => {
    const element = viewport.current;
    if (element && following.current) element.scrollTop = element.scrollHeight;
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- New entries change the rendered height; scroll only while following the tail.
  }, [entries]);

  // Keep the bottom visible when resizing rewraps lines.
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(() => {
      if (following.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={classes.logBox}>
      <div className={classes.copy}>
        <CopyValueButton
          value={copyText}
          copyLabel={t("actions.copy", { ns: "common" })}
          copiedLabel={t("actions.copied", { ns: "common" })}
          disabled={entries.length === 0}
          variant="subtle"
        />
      </div>
      <Code
        block
        bg="transparent"
        className={classes.output}
        ref={viewport}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Code renders a pre; name it as a scroll region.
        role="region"
        aria-label={t("logs.output.label")}
        tabIndex={0}
        onScroll={(event) => {
          const element = event.currentTarget;
          following.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <=
            2;
        }}
      >
        {entries.length === 0 && (
          <Text component="span" size="sm" c="dimmed">
            {loading ? t("logs.output.loading") : t("logs.output.empty")}
          </Text>
        )}
        {entries.map((entry) => (
          <span
            key={entry.id}
            className={classes.entry}
            data-level={entry.level}
          >
            {entry.text}
            {entry.truncated && (
              <span className={classes.truncated}>{truncatedSuffix}</span>
            )}
          </span>
        ))}
      </Code>
    </div>
  );
});

import { Code, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CopyValueButton } from "@/shared/components/CopyValueButton";
import { formatUnit } from "@/shared/lib/numberFormat";
import { utf8ByteLength } from "@/shared/lib/text";

interface FormattedMessagePreviewProps {
  value: string;
}

export function FormattedMessagePreview({
  value,
}: FormattedMessagePreviewProps) {
  const { i18n, t } = useTranslation(["messages", "common"]);
  const byteLength = utf8ByteLength(value);

  return (
    <Stack gap="xs" style={{ flexShrink: 0, minHeight: 0, minWidth: 0 }}>
      <Group justify="space-between">
        <Text fw={600} size="sm">
          {t("preview.title")}
        </Text>
        <CopyValueButton
          copiedLabel={t("actions.copied", { ns: "common" })}
          copyLabel={t("actions.copy", { ns: "common" })}
          disabled={!value}
          value={value}
        >
          <Text aria-live="polite" ff="monospace" size="xs">
            {formatUnit(i18n.language, byteLength, "byte")}
          </Text>
        </CopyValueButton>
      </Group>
      <Paper
        component="pre"
        h="10rem"
        m={0}
        p="sm"
        radius="md"
        style={{ maxWidth: "100%", minWidth: 0, overflow: "auto" }}
        withBorder
      >
        {value ? (
          <Code
            bg="transparent"
            p={0}
            style={{
              display: "block",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {value}
          </Code>
        ) : (
          <Text c="dimmed" component="span" size="sm">
            {t("preview.empty")}
          </Text>
        )}
      </Paper>
    </Stack>
  );
}

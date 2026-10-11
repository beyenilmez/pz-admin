import { Text } from "@mantine/core";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import {
  isGameMessageTextAllowed,
  parseGameMessage,
  sanitizeGameMessageText,
  serializeGameMessage,
} from "@/features/messages/lib/gameMessageCodec";
import { formatNumber, formatUnit } from "@/shared/lib/numberFormat";
import { utf8ByteLength } from "@/shared/lib/text";
import { MessageEditor } from "./MessageEditor";

interface GameMessageEditorProps {
  build: GameBuild;
  className?: string;
  maxHeight?: CSSProperties["maxHeight"];
  maxBytes?: number;
  minHeight?: CSSProperties["minHeight"];
  onChange: (value: string) => void;
  value: string;
}

export function GameMessageEditor({
  build,
  className,
  maxHeight,
  maxBytes,
  minHeight,
  onChange,
  value,
}: GameMessageEditorProps) {
  const { i18n } = useTranslation();
  const byteLength = utf8ByteLength(value);

  return (
    <MessageEditor
      build={build}
      className={className}
      initialDocument={parseGameMessage(value, build)}
      isTextAllowed={isGameMessageTextAllowed}
      maxHeight={maxHeight}
      minHeight={minHeight}
      onChange={(document) => onChange(serializeGameMessage(document, build))}
      sanitizePastedText={sanitizeGameMessageText}
      toolbarEnd={
        maxBytes === undefined ? null : (
          <Text
            aria-live="polite"
            c={byteLength > maxBytes ? "red" : "dimmed"}
            ff="monospace"
            ml="auto"
            px="xs"
            size="xs"
          >
            {formatNumber(i18n.language, byteLength)} /{" "}
            {formatUnit(i18n.language, maxBytes, "byte")}
          </Text>
        )
      }
    />
  );
}

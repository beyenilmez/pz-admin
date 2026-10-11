import { RichTextEditor, useRichTextEditorContext } from "@mantine/tiptap";
import { IconTextSize } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  defaultGameMessageSize,
  gameMessageFontMetrics,
} from "@/features/messages/lib/gameMessageCodec";
import { readStringAttribute } from "@/features/messages/lib/messageEditorAdapter";
import type { GameBuild } from "@/features/game/types";
import type { MessageSize } from "@/features/messages/types";

const sizes: MessageSize[] = ["small", "medium", "large"];
const iconSizes: Record<MessageSize, number> = {
  small: 12,
  medium: 16,
  large: 20,
};

interface MessageSizeControlProps {
  build: GameBuild;
}

export function MessageSizeControl({ build }: MessageSizeControlProps) {
  const { t } = useTranslation("messages");
  const { editor } = useRichTextEditorContext();
  const attributes: unknown = editor?.getAttributes("textStyle");
  const activeSize = getActiveSize(
    readStringAttribute(attributes, "fontSize"),
    build,
  );

  function setSize(size: MessageSize) {
    const command = editor?.chain().focus();
    if (size === defaultGameMessageSize) command?.unsetFontSize().run();
    else command?.setFontSize(gameMessageFontMetrics[build].sizes[size]).run();
  }

  return (
    <RichTextEditor.ControlsGroup>
      {sizes.map((size) => {
        return (
          <RichTextEditor.Control
            active={size === activeSize}
            aria-label={t(`editor.size.options.${size}`)}
            key={size}
            onClick={() => setSize(size)}
            title={t(`editor.size.options.${size}`)}
          >
            <IconTextSize aria-hidden="true" size={iconSizes[size]} />
          </RichTextEditor.Control>
        );
      })}
    </RichTextEditor.ControlsGroup>
  );
}

function getActiveSize(
  fontSize: string | undefined,
  build: GameBuild,
): MessageSize {
  return (
    sizes.find(
      (size) => gameMessageFontMetrics[build].sizes[size] === fontSize,
    ) ?? defaultGameMessageSize
  );
}

import {
  Button,
  ColorPicker,
  ColorSwatch,
  Popover,
  Stack,
} from "@mantine/core";
import { RichTextEditor, useRichTextEditorContext } from "@mantine/tiptap";
import { useTranslation } from "react-i18next";
import { defaultGameMessageColor } from "@/features/messages/lib/gameMessageColors";
import { readStringAttribute } from "@/features/messages/lib/messageEditorAdapter";
import { messageColorSwatches } from "@/features/messages/lib/messageEditorConfig";

export function MessageColorControl() {
  const { t } = useTranslation("messages");
  const { editor } = useRichTextEditorContext();
  const attributes: unknown = editor?.getAttributes("textStyle");
  const color = readStringAttribute(attributes, "color");

  return (
    <Popover position="bottom-start" shadow="md" width={220}>
      <Popover.Target>
        <RichTextEditor.Control
          aria-label={t("editor.color.label")}
          p={0}
          style={{ overflow: "hidden" }}
          title={t("editor.color.label")}
        >
          <ColorSwatch
            color={color ?? defaultGameMessageColor}
            radius={0}
            size="100%"
            withShadow
          />
        </RichTextEditor.Control>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <ColorPicker
            focusable
            format="hex"
            fullWidth
            hueLabel={t("editor.colorPicker.hue.label")}
            onChange={(value) => editor?.chain().focus().setColor(value).run()}
            saturationLabel={t("editor.colorPicker.saturation.label")}
            swatches={messageColorSwatches}
            swatchesPerRow={9}
            value={color ?? defaultGameMessageColor}
          />
          <Button
            disabled={!color}
            onClick={() => editor?.chain().focus().unsetColor().run()}
            size="xs"
            variant="default"
          >
            {t("editor.color.actions.useDefault")}
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

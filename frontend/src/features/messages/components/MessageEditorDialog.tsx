import { useState } from "react";
import { Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { utf8ByteLength } from "@/shared/lib/text";
import { dialogEditorViewport, dialogSizes } from "@/shared/layout/dialogs";
import { GameMessageEditor } from "./GameMessageEditor";

interface MessageEditorDialogProps {
  build: GameBuild;
  descriptionId?: string;
  disabled?: boolean;
  invalid?: boolean;
  labelId?: string;
  maxBytes?: number;
  onChange: (value: string) => void;
  value: string;
}

// The editor keeps its document model behind the serialized game-message boundary.
export function MessageEditorDialog({
  build,
  descriptionId,
  disabled,
  invalid,
  labelId,
  maxBytes,
  onChange,
  value,
}: MessageEditorDialogProps) {
  const { t } = useTranslation(["messages", "common"]);
  const [opened, modal] = useDisclosure(false);
  const [draft, setDraft] = useState("");
  const overLimit = maxBytes !== undefined && utf8ByteLength(draft) > maxBytes;

  function openEditor() {
    setDraft(value);
    modal.open();
  }

  function applyChanges() {
    onChange(draft);
    modal.close();
  }

  return (
    <>
      <Button
        aria-describedby={descriptionId}
        aria-invalid={invalid || undefined}
        aria-labelledby={labelId}
        disabled={disabled}
        fullWidth
        leftSection={<IconEdit size={15} aria-hidden="true" />}
        onClick={openEditor}
        type="button"
        variant="default"
      >
        {t("actions.edit", { ns: "messages" })}
      </Button>

      <Modal
        opened={opened}
        onClose={modal.close}
        size={dialogSizes.editor}
        title={t("dialog.title", { ns: "messages" })}
      >
        <Stack gap="md">
          <GameMessageEditor
            build={build}
            {...dialogEditorViewport}
            maxBytes={maxBytes}
            onChange={setDraft}
            value={draft}
          />
          <Group justify="flex-end">
            <Button onClick={modal.close} variant="default">
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button disabled={overLimit} onClick={applyChanges}>
              {t("actions.apply", { ns: "common" })}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

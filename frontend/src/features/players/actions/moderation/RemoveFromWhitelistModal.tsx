import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { dialogSizes } from "@/shared/layout/dialogs";
import type { Player } from "@bindings/internal/player/models";

interface RemoveFromWhitelistModalProps {
  onClose: () => void;
  onRemove: (players: Player[]) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function RemoveFromWhitelistModal({
  onClose,
  onRemove,
  opened,
  players,
}: RemoveFromWhitelistModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const [submitting, setSubmitting] = useState(false);

  async function handleRemove() {
    setSubmitting(true);
    const succeeded = await onRemove(players);
    setSubmitting(false);
    if (succeeded) onClose();
  }

  const targetDescription = t("dialogs.removeFromWhitelist.description", {
    count: players.length,
    username: players[0]?.username,
  });

  return (
    <Modal
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      opened={opened}
      onClose={onClose}
      size={dialogSizes.compact}
      title={t("dialogs.removeFromWhitelist.title", { count: players.length })}
      withCloseButton={!submitting}
    >
      <Stack>
        <Text size="sm">{targetDescription}</Text>
        <Group justify="flex-end" mt="xs">
          <Button disabled={submitting} onClick={onClose} variant="default">
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button
            color="red"
            loading={submitting}
            onClick={() => void handleRemove()}
          >
            {t("actions.remove", { ns: "common" })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { dialogSizes } from "@/shared/layout/dialogs";
import type { Player } from "@bindings/internal/player/models";

interface ThunderPlayerModalProps {
  onClose: () => void;
  onThunder: (players: Player[]) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function ThunderPlayerModal({
  onClose,
  onThunder,
  opened,
  players,
}: ThunderPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const [triggering, setTriggering] = useState(false);

  async function handleThunder() {
    setTriggering(true);
    try {
      const succeeded = await onThunder(players);
      if (succeeded) onClose();
    } finally {
      setTriggering(false);
    }
  }

  const targetDescription = t("dialogs.thunder.description", {
    count: players.length,
    username: players[0]?.username,
  });

  return (
    <Modal
      closeOnClickOutside={!triggering}
      closeOnEscape={!triggering}
      opened={opened}
      onClose={onClose}
      size={dialogSizes.compact}
      title={t("dialogs.thunder.title")}
      withCloseButton={!triggering}
    >
      <Stack>
        <Text size="sm">{targetDescription}</Text>
        <Group justify="flex-end" mt="xs">
          <Button disabled={triggering} onClick={onClose} variant="default">
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button loading={triggering} onClick={handleThunder}>
            {t("dialogs.thunder.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

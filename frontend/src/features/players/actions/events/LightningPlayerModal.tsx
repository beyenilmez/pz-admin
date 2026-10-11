import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { dialogSizes } from "@/shared/layout/dialogs";
import type { Player } from "@bindings/internal/player/models";

interface LightningPlayerModalProps {
  onClose: () => void;
  onLightning: (players: Player[]) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function LightningPlayerModal({
  onClose,
  onLightning,
  opened,
  players,
}: LightningPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const [triggering, setTriggering] = useState(false);

  async function handleLightning() {
    setTriggering(true);
    try {
      const succeeded = await onLightning(players);
      if (succeeded) onClose();
    } finally {
      setTriggering(false);
    }
  }

  const targetDescription = t("dialogs.lightning.description", {
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
      title={t("dialogs.lightning.title")}
      withCloseButton={!triggering}
    >
      <Stack>
        <Text size="sm">{targetDescription}</Text>
        <Group justify="flex-end" mt="xs">
          <Button disabled={triggering} onClick={onClose} variant="default">
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button loading={triggering} onClick={handleLightning}>
            {t("dialogs.lightning.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

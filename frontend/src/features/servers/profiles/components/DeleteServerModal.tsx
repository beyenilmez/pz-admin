import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { dialogSizes } from "@/shared/layout/dialogs";
import type { Profile } from "@bindings/internal/profile/models";
import { errorMessage } from "@/shared/lib/errors";

interface DeleteServerModalProps {
  onClose: () => void;
  onDelete: (profile: Profile) => Promise<void>;
  opened: boolean;
  profile: Profile | null;
}

export function DeleteServerModal({
  onClose,
  onDelete,
  opened,
  profile,
}: DeleteServerModalProps) {
  const { t } = useTranslation(["servers", "common"]);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!profile) return;

    setDeleting(true);
    try {
      await onDelete(profile);
      onClose();
    } catch (deleteError) {
      notifications.show({
        color: "red",
        title: t("dialogs.delete.error.title"),
        message: errorMessage(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("dialogs.delete.title")}
      size={dialogSizes.compact}
      closeOnClickOutside={!deleting}
      closeOnEscape={!deleting}
      withCloseButton={!deleting}
    >
      <Stack>
        <Text>
          {t("dialogs.delete.description", {
            serverName: profile?.name ?? "",
          })}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={deleting}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button color="red" loading={deleting} onClick={handleDelete}>
            {t("actions.delete", { ns: "common" })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

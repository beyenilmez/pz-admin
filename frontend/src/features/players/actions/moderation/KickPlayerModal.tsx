import { useEffectEvent, useLayoutEffect } from "react";
import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";

interface KickFormValues {
  reason: string;
}

interface KickPlayerModalProps {
  onClose: () => void;
  onKick: (players: Player[], reason: string) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function KickPlayerModal({
  onClose,
  onKick,
  opened,
  players,
}: KickPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<KickFormValues>({
    mode: "uncontrolled",
    initialValues: { reason: "" },
  });

  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: KickFormValues) {
    const succeeded = await onKick(players, values.reason.trim());
    if (succeeded) onClose();
  }

  const targetDescription = t("dialogs.kick.description", {
    count: players.length,
    username: players[0]?.username,
  });

  return (
    <Modal
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      title={t("dialogs.kick.title", { count: players.length })}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text c="dimmed" size="sm">
            {targetDescription}
          </Text>
          <Textarea
            key={form.key("reason")}
            autosize
            label={t("fields.reason.label")}
            maxRows={5}
            minRows={3}
            name="reason"
            placeholder={t("fields.reason.placeholder")}
            {...form.getInputProps("reason")}
          />
          <Group justify="flex-end" mt="xs">
            <Button
              disabled={form.submitting}
              onClick={onClose}
              variant="default"
            >
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button
              disabled={!form.isValid()}
              loading={form.submitting}
              type="submit"
            >
              {t("dialogs.kick.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

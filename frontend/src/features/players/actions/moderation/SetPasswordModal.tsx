import { useEffectEvent, useLayoutEffect } from "react";
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";

interface SetPasswordFormValues {
  password: string;
}

interface SetPasswordModalProps {
  onClose: () => void;
  onSetPassword: (players: Player[], password: string) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function SetPasswordModal({
  onClose,
  onSetPassword,
  opened,
  players,
}: SetPasswordModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<SetPasswordFormValues>({
    mode: "controlled",
    initialValues: { password: "" },
    validate: {
      password: isNotEmpty(),
    },
  });
  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: SetPasswordFormValues) {
    const succeeded = await onSetPassword(players, values.password);
    if (succeeded) onClose();
  }

  return (
    <Modal
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      title={t("dialogs.setPassword.title", { count: players.length })}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text c="dimmed" size="sm">
            {t("dialogs.setPassword.description", {
              count: players.length,
              username: players[0]?.username,
            })}
          </Text>
          <PasswordInput
            key={form.key("password")}
            autoComplete="new-password"
            data-autofocus
            label={t("fields.password.label", { ns: "common" })}
            name="password"
            required
            {...form.getInputProps("password")}
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
              {t("dialogs.setPassword.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

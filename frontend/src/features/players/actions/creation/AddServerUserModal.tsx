import { useEffectEvent, useLayoutEffect } from "react";
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

interface AddServerUserFormValues {
  password: string;
  username: string;
}

interface AddServerUserModalProps {
  onAdd: (username: string, password: string) => Promise<boolean>;
  onClose: () => void;
  opened: boolean;
}

export function AddServerUserModal({
  onAdd,
  onClose,
  opened,
}: AddServerUserModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<AddServerUserFormValues>({
    mode: "controlled",
    initialValues: { password: "", username: "" },
    validate: {
      password: isNotEmpty(),
      username: isNotEmpty(),
    },
  });
  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: AddServerUserFormValues) {
    const succeeded = await onAdd(values.username.trim(), values.password);
    if (succeeded) onClose();
  }

  return (
    <Modal
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      title={t("dialogs.addServerUser.title")}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            key={form.key("username")}
            autoComplete="off"
            data-autofocus
            label={t("fields.username.label")}
            name="username"
            required
            {...form.getInputProps("username")}
          />
          <PasswordInput
            key={form.key("password")}
            autoComplete="new-password"
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
              {t("dialogs.addServerUser.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

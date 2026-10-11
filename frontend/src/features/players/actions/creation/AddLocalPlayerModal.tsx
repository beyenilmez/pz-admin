import { useEffectEvent, useLayoutEffect } from "react";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

interface AddLocalPlayerFormValues {
  username: string;
}

interface AddLocalPlayerModalProps {
  onAdd: (username: string) => Promise<boolean>;
  onClose: () => void;
  opened: boolean;
}

export function AddLocalPlayerModal({
  onAdd,
  onClose,
  opened,
}: AddLocalPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<AddLocalPlayerFormValues>({
    mode: "controlled",
    initialValues: { username: "" },
    validate: {
      username: isNotEmpty(),
    },
  });
  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: AddLocalPlayerFormValues) {
    const succeeded = await onAdd(values.username.trim());
    if (succeeded) onClose();
  }

  return (
    <Modal
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      title={t("dialogs.addLocalPlayer.title")}
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
              {t("dialogs.addLocalPlayer.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

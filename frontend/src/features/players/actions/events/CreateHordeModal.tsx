import { useEffectEvent, useLayoutEffect } from "react";
import { Button, Group, Modal, NumberInput, Stack, Text } from "@mantine/core";
import { isInRange, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";

interface CreateHordeFormValues {
  count: number | string;
}

interface CreateHordeModalProps {
  onClose: () => void;
  onCreate: (players: Player[], count: number) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function CreateHordeModal({
  onClose,
  onCreate,
  opened,
  players,
}: CreateHordeModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<CreateHordeFormValues>({
    mode: "controlled",
    initialValues: { count: "" },
    validate: {
      count: isInRange(
        { min: 1, max: 2_147_483_647 },
        t("dialogs.createHorde.validation.sizeRange"),
      ),
    },
  });

  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: CreateHordeFormValues) {
    const count =
      typeof values.count === "number" ? values.count : Number(values.count);
    const succeeded = await onCreate(players, count);
    if (succeeded) onClose();
  }

  const targetDescription = t("dialogs.createHorde.description", {
    count: players.length,
    username: players[0]?.username,
  });

  return (
    <Modal
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      title={t("dialogs.createHorde.title")}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack>
          <Text c="dimmed" size="sm">
            {targetDescription}
          </Text>
          <NumberInput
            allowDecimal={false}
            clampBehavior="none"
            label={t("dialogs.createHorde.size.label")}
            max={2_147_483_647}
            min={1}
            name="count"
            placeholder="150"
            required
            {...form.getInputProps("count")}
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
              {t("dialogs.createHorde.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

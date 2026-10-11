import { useEffectEvent, useLayoutEffect } from "react";
import { Badge, Button, Group, Modal, Radio, Stack, Text } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { dialogSizes } from "@/shared/layout/dialogs";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { accessLevelColor } from "../../lib/accessLevel";

const build41AccessLevels = [
  "none",
  "observer",
  "gm",
  "overseer",
  "moderator",
  "admin",
] as const;

const build42AccessLevels = [
  "user",
  "priority",
  "observer",
  "gm",
  "moderator",
  "admin",
] as const;

type AccessLevel =
  (typeof build41AccessLevels)[number] | (typeof build42AccessLevels)[number];

interface SetAccessLevelFormValues {
  accessLevel: AccessLevel | "";
}

interface SetAccessLevelModalProps {
  build: GameBuild;
  onClose: () => void;
  onSetAccessLevel: (
    players: Player[],
    accessLevel: AccessLevel,
  ) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

function initialAccessLevel(
  players: Player[],
  accessLevels: readonly AccessLevel[],
): AccessLevel | "" {
  if (players.length === 0) return "";

  const first = players[0].accessLevel?.toLowerCase();
  const knownLevel = accessLevels.find((level) => level === first);
  const allMatch = players.every((player) => {
    const value = player.accessLevel?.toLowerCase();
    return value === first;
  });

  return allMatch ? (knownLevel ?? "") : "";
}

export function SetAccessLevelModal({
  build,
  onClose,
  onSetAccessLevel,
  opened,
  players,
}: SetAccessLevelModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<SetAccessLevelFormValues>({
    mode: "controlled",
    initialValues: { accessLevel: "" },
    validate: {
      accessLevel: isNotEmpty(),
    },
  });
  const accessLevels =
    build === "41" ? build41AccessLevels : build42AccessLevels;

  const resetForm = useEffectEvent((nextPlayers: Player[]) => {
    form.reset();
    form.setFieldValue(
      "accessLevel",
      initialAccessLevel(nextPlayers, accessLevels),
    );
  });

  useLayoutEffect(() => {
    if (opened) resetForm(players);
  }, [opened, players]);

  async function handleSubmit(values: SetAccessLevelFormValues) {
    if (!values.accessLevel) return;
    const succeeded = await onSetAccessLevel(players, values.accessLevel);
    if (succeeded) onClose();
  }

  const targetDescription = t("dialogs.setRole.description", {
    count: players.length,
    username: players[0]?.username,
  });

  return (
    <Modal
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      size={dialogSizes.compact}
      title={t("dialogs.setRole.title")}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack>
          <Text c="dimmed" size="sm">
            {targetDescription}
          </Text>

          <Radio.Group
            label={t("dialogs.setRole.role.label")}
            required
            {...form.getInputProps("accessLevel")}
          >
            <Stack gap="xs" mt="xs">
              {accessLevels.map((level) => (
                <Radio
                  key={level}
                  label={
                    <Badge color={accessLevelColor(level)} variant="light">
                      {t(`roles.${level}`)}
                    </Badge>
                  }
                  value={level}
                />
              ))}
            </Stack>
          </Radio.Group>

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
              {t("dialogs.setRole.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

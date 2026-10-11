import { useEffectEvent, useLayoutEffect, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  PasswordInput,
  Radio,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { isInRange, isNotEmpty, isOneOf, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Profile } from "@bindings/internal/profile/models";
import { gameBuilds } from "@/features/game/types";
import { errorMessage } from "@/shared/lib/errors";
import {
  createInitialServerFormValues,
  createProfileFromFormValues,
  type ServerFormErrors,
  type ServerFormValues,
} from "../lib/serverForm";

interface ServerFormModalProps {
  onClose: () => void;
  onSave: (profile: Profile, password: string) => Promise<void>;
  opened: boolean;
  profile: Profile | null;
}

export function ServerFormModal({
  onClose,
  onSave,
  opened,
  profile,
}: ServerFormModalProps) {
  const { t } = useTranslation(["servers", "common"]);
  const editing = profile !== null;
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ServerFormValues>({
    mode: "controlled",
    initialValues: createInitialServerFormValues(profile),
    validate: {
      name: isNotEmpty(),
      host: isNotEmpty(),
      port: isInRange({ min: 1, max: 65535 }, t("form.validation.portRange")),
      version: isOneOf(["auto", ...gameBuilds]),
      password: (value) => (editing || value ? null : true),
    },
  });

  const resetForm = useEffectEvent((nextProfile: Profile | null) => {
    const values = createInitialServerFormValues(nextProfile);
    form.setInitialValues(values);
    form.setValues(values);
    form.clearErrors();
    setFormError(null);
  });

  useLayoutEffect(() => {
    if (!opened) return;
    resetForm(profile);
  }, [opened, profile]);

  async function handleSubmit(values: ServerFormValues) {
    setFormError(null);
    try {
      await onSave(
        createProfileFromFormValues(values, profile),
        values.password,
      );
      onClose();
    } catch (saveError) {
      setFormError(errorMessage(saveError));
    }
  }

  function focusFirstInvalidField(errors: ServerFormErrors) {
    const firstError = Object.keys(errors)[0];
    if (firstError) form.getInputNode(firstError)?.focus();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? t("form.edit.title") : t("form.add.title")}
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      withCloseButton={!form.submitting}
    >
      <form
        onSubmit={form.onSubmit(handleSubmit, focusFirstInvalidField)}
        noValidate
      >
        <Stack>
          {formError ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("form.errors.save.title")}
              aria-live="polite"
            >
              {formError}
            </Alert>
          ) : null}
          <TextInput
            key={form.key("name")}
            label={t("form.fields.name.label")}
            name="name"
            autoComplete="off"
            required
            {...form.getInputProps("name")}
          />
          <Radio.Group
            key={form.key("version")}
            label={t("gameBuild.label", { ns: "common" })}
            name="version"
            required
            {...form.getInputProps("version")}
          >
            <Group mt="xs">
              <Radio
                value="auto"
                label={t("gameBuild.options.auto", { ns: "common" })}
              />
              {gameBuilds.map((build) => (
                <Radio
                  key={build}
                  value={build}
                  label={t("gameBuild.value", {
                    ns: "common",
                    version: build,
                  })}
                />
              ))}
            </Group>
          </Radio.Group>
          <Radio.Group
            label={t("form.fields.connectionMethod.label")}
            value="rcon"
            name="connectionMethod"
          >
            <Group mt="xs">
              <Radio value="rcon" label="RCON" />
            </Group>
          </Radio.Group>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <TextInput
              key={form.key("host")}
              label={t("form.fields.host.label")}
              name="host"
              autoComplete="off"
              spellCheck={false}
              required
              {...form.getInputProps("host")}
            />
            <NumberInput
              key={form.key("port")}
              label={t("form.fields.port.label")}
              name="port"
              required
              min={1}
              max={65535}
              allowDecimal={false}
              clampBehavior="none"
              {...form.getInputProps("port")}
            />
          </SimpleGrid>
          <PasswordInput
            key={form.key("password")}
            label={t("fields.password.label", { ns: "common" })}
            description={
              editing
                ? t("form.fields.password.edit.description")
                : t("form.fields.password.create.description")
            }
            name="password"
            autoComplete="off"
            required={!editing}
            {...form.getInputProps("password")}
          />
          <Group justify="flex-end" mt="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={form.submitting}
            >
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button
              disabled={!form.isValid()}
              loading={form.submitting}
              type="submit"
            >
              {editing
                ? t("actions.saveChanges", { ns: "common" })
                : t("form.add.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

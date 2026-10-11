import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { IconAlertCircle, IconPlus, IconServer } from "@tabler/icons-react";
import type { Profile } from "@bindings/internal/profile/models";
import { PageContainer } from "@/shared/layout/PageContainer";
import { useAppConfig } from "@/features/config/AppConfigProvider";
import { useSession } from "@/features/session/SessionProvider";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import { errorMessage } from "@/shared/lib/errors";
import { DeleteServerModal } from "./components/DeleteServerModal";
import { ServerCard } from "./components/ServerCard";
import { ServerFormModal } from "./components/ServerFormModal";
import { useProfileDialog } from "./hooks/useProfileDialog";
import { useServerProfiles } from "./hooks/useServerProfiles";

export function ServerProfilesPage() {
  const { t } = useTranslation(["servers", "common", "session"]);
  const { config } = useAppConfig();
  const {
    connect,
    initializationError,
    profile: sessionProfile,
    retryInitialization,
    state: sessionState,
  } = useSession();
  const { clearLoadError, load, loadError, loading, profiles, remove, save } =
    useServerProfiles(config?.language);
  const formDialog = useProfileDialog();
  const deleteDialog = useProfileDialog();
  const connecting = sessionState === "connecting";
  const skeleton = useSkeletonVisibility(loading && profiles.length === 0);

  async function handleConnect(profile: Profile) {
    try {
      await connect(profile);
    } catch (connectionError) {
      notifications.show({
        color: "red",
        title: t("errors.connect.title", { ns: "session" }),
        message: errorMessage(connectionError),
      });
    }
  }

  return (
    <>
      <PageContainer contentWidth="standard" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Title order={1}>{t("profiles.title")}</Title>
            {!loading && profiles.length > 0 && (
              <Button
                leftSection={<IconPlus size={16} aria-hidden="true" />}
                disabled={connecting}
                onClick={() => formDialog.open(null)}
              >
                {t("profiles.actions.add")}
              </Button>
            )}
          </Group>

          {initializationError ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("profiles.errors.connectionCheck.title")}
              aria-live="polite"
            >
              <Stack gap="xs" align="flex-start">
                <Text size="sm">{initializationError}</Text>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => void retryInitialization()}
                >
                  {t("actions.retry", { ns: "common" })}
                </Button>
              </Stack>
            </Alert>
          ) : null}

          {loadError ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("profiles.errors.load.title")}
              aria-live="polite"
              withCloseButton={profiles.length > 0}
              closeButtonLabel={t("profiles.errors.actions.dismiss")}
              onClose={clearLoadError}
            >
              <Stack gap="xs" align="flex-start">
                <Text size="sm">{loadError}</Text>
                {profiles.length === 0 && (
                  <Button variant="light" size="xs" onClick={() => void load()}>
                    {t("actions.retry", { ns: "common" })}
                  </Button>
                )}
              </Stack>
            </Alert>
          ) : null}

          {skeleton.visible ? (
            <SimpleGrid
              minColWidth={260}
              aria-busy="true"
              aria-label={t("profiles.loading.label")}
            >
              <Skeleton height={112} />
              <Skeleton height={112} />
              <Skeleton height={112} />
            </SimpleGrid>
          ) : skeleton.active ? null : loadError &&
            profiles.length === 0 ? null : profiles.length === 0 ? (
            <Paper withBorder p="xl">
              <Stack align="center" ta="center" py="xl">
                <IconServer
                  size={40}
                  stroke={1.5}
                  color="var(--mantine-color-dimmed)"
                  aria-hidden="true"
                />
                <Box>
                  <Title order={2} size="h3">
                    {t("profiles.empty.title")}
                  </Title>
                  <Text c="dimmed" mt={4}>
                    {t("profiles.empty.description")}
                  </Text>
                </Box>
                <Button
                  leftSection={<IconPlus size={16} aria-hidden="true" />}
                  disabled={connecting}
                  onClick={() => formDialog.open(null)}
                >
                  {t("profiles.actions.add")}
                </Button>
              </Stack>
            </Paper>
          ) : (
            <SimpleGrid minColWidth={260}>
              {profiles.map((profile) => (
                <ServerCard
                  key={profile.id}
                  connecting={connecting && sessionProfile?.id === profile.id}
                  disabled={connecting}
                  onConnect={(selectedProfile) =>
                    void handleConnect(selectedProfile)
                  }
                  profile={profile}
                  onDelete={deleteDialog.open}
                  onEdit={formDialog.open}
                />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </PageContainer>

      <ServerFormModal
        opened={formDialog.opened}
        onClose={formDialog.close}
        onSave={save}
        profile={formDialog.profile}
      />

      <DeleteServerModal
        opened={deleteDialog.opened}
        onClose={deleteDialog.close}
        onDelete={remove}
        profile={deleteDialog.profile}
      />
    </>
  );
}

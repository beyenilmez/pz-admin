import { Group, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useSession } from "@/features/session/SessionProvider";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import { PageContainer } from "@/shared/layout/PageContainer";
import { ServerWorkspace } from "./components/ServerWorkspace";
import { ServerProfilesPage } from "./profiles/ServerProfilesPage";

export function ServerPage() {
  const { t } = useTranslation("session");
  const { profile, state } = useSession();
  const skeleton = useSkeletonVisibility(state === "initializing");

  if (skeleton.active) {
    return (
      <PageContainer
        contentWidth="standard"
        py="xl"
        aria-busy="true"
        aria-label={t("loading.label")}
      >
        {skeleton.visible ? (
          <Stack gap="lg">
            <Group justify="space-between" align="center" aria-hidden="true">
              <Skeleton h={42} w={190} />
              <Skeleton h={36} w={122} />
            </Group>
            <SimpleGrid minColWidth={260} aria-hidden="true">
              <Skeleton height={112} />
              <Skeleton height={112} />
              <Skeleton height={112} />
            </SimpleGrid>
          </Stack>
        ) : null}
      </PageContainer>
    );
  }

  if (profile && (state === "connected" || state === "disconnecting")) {
    return <ServerWorkspace />;
  }

  return <ServerProfilesPage />;
}

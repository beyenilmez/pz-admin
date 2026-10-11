import type { ReactNode } from "react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import {
  IconAdjustments,
  IconBolt,
  IconTerminal2,
  IconUsers,
} from "@tabler/icons-react";
import {
  SectionNavigation,
  SectionNavigationPanel,
} from "@/shared/layout/SectionNavigation";
import { useSession } from "@/features/session/SessionProvider";
import { ConsolePage } from "@/features/console/ConsolePage";
import { OptionsPage } from "@/features/options/OptionsPage";
import { PlayersPage } from "@/features/players/PlayersPage";
import { ServerActionsPage } from "@/features/server-actions/ServerActionsPage";
import { usePersistentNavigation } from "@/shared/hooks/usePersistentNavigation";
import { errorMessage } from "@/shared/lib/errors";
import { ServerConnectionFooter } from "./ServerConnectionFooter";

type ServerWorkspacePage = "players" | "options" | "serverActions" | "console";

export function ServerWorkspace() {
  const { t } = useTranslation(["servers", "session"]);
  const navigation = usePersistentNavigation<ServerWorkspacePage>("players");
  const { disconnect, profile, state } = useSession();
  const navigationItems = [
    {
      value: "players",
      label: t("page.title", { ns: "players" }),
      icon: <IconUsers size={16} aria-hidden="true" />,
    },
    {
      value: "options",
      label: t("page.title", { ns: "options" }),
      icon: <IconAdjustments size={16} aria-hidden="true" />,
    },
    {
      value: "serverActions",
      label: t("page.title", { ns: "serverActions" }),
      icon: <IconBolt size={16} aria-hidden="true" />,
    },
    {
      value: "console",
      label: t("page.title", { ns: "console" }),
      icon: <IconTerminal2 size={16} aria-hidden="true" />,
    },
  ] satisfies Array<{
    icon: ReactNode;
    label: string;
    value: ServerWorkspacePage;
  }>;

  if (!profile || (state !== "connected" && state !== "disconnecting")) {
    return null;
  }

  async function handleDisconnect() {
    try {
      await disconnect();
    } catch (disconnectError) {
      notifications.show({
        color: "red",
        title: t("errors.disconnect.title", { ns: "session" }),
        message: errorMessage(disconnectError),
      });
    }
  }

  return (
    <SectionNavigation
      activePage={navigation.activePage}
      items={navigationItems}
      label={t("workspace.navigation.label")}
      onPageChange={navigation.changePage}
      sidebarWidth={208}
      footer={
        <ServerConnectionFooter
          profile={profile}
          state={state}
          onDisconnect={() => void handleDisconnect()}
        />
      }
    >
      <SectionNavigationPanel page="players">
        <PlayersPage />
      </SectionNavigationPanel>
      <SectionNavigationPanel page="options" scrollable={false}>
        {navigation.isVisited("options") ? (
          <OptionsPage active={navigation.activePage === "options"} />
        ) : null}
      </SectionNavigationPanel>
      <SectionNavigationPanel page="serverActions">
        {navigation.isVisited("serverActions") ? <ServerActionsPage /> : null}
      </SectionNavigationPanel>
      <SectionNavigationPanel page="console">
        {navigation.isVisited("console") ? <ConsolePage /> : null}
      </SectionNavigationPanel>
    </SectionNavigation>
  );
}

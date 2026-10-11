import { ApplicationShell, ApplicationShellPanel } from "./ApplicationShell";
import { ServerPage } from "@/features/servers/ServerPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { ToolsPage } from "@/features/tools/ToolsPage";
import type { AppSection } from "@/app/navigation";
import { usePersistentNavigation } from "@/shared/hooks/usePersistentNavigation";

export function App() {
  const navigation = usePersistentNavigation<AppSection>("server");

  return (
    <ApplicationShell
      activeSection={navigation.activePage}
      onSectionChange={navigation.changePage}
    >
      <ApplicationShellPanel section="server" fullHeight>
        <ServerPage />
      </ApplicationShellPanel>
      <ApplicationShellPanel section="tools" fullHeight>
        {navigation.isVisited("tools") ? <ToolsPage /> : null}
      </ApplicationShellPanel>
      <ApplicationShellPanel section="settings" width="narrow">
        {navigation.isVisited("settings") ? <SettingsPage /> : null}
      </ApplicationShellPanel>
    </ApplicationShell>
  );
}

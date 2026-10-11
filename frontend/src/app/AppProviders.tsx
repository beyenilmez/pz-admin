import { useMemo, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { AppConfigProvider } from "@/features/config/AppConfigProvider";
import { nonPersistentColorSchemeManager } from "@/features/config/colorSchemeManager";
import { PlayersProvider } from "@/features/players/PlayersProvider";
import { SessionProvider } from "@/features/session/SessionProvider";
import { createAppTheme } from "./theme";
import { NativeWindowTheme } from "./NativeWindowTheme";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const { t } = useTranslation("common");
  const closeButtonLabel = t("actions.close");
  const theme = useMemo(
    () => createAppTheme(closeButtonLabel),
    [closeButtonLabel],
  );

  return (
    <MantineProvider
      colorSchemeManager={nonPersistentColorSchemeManager}
      defaultColorScheme="auto"
      theme={theme}
    >
      <NativeWindowTheme />
      <Notifications />
      <AppConfigProvider>
        <SessionProvider>
          <PlayersProvider>{children}</PlayersProvider>
        </SessionProvider>
      </AppConfigProvider>
    </MantineProvider>
  );
}

import { useEffect, useMemo, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { createAppTheme } from "@/app/theme";
import { detectLanguage, isSupportedLanguage } from "@/i18n/locales";
import appI18n from "@/i18n";

const languageStorageKey = "pz-admin-website-language";

function initialLanguage() {
  try {
    const stored = localStorage.getItem(languageStorageKey);
    if (stored && isSupportedLanguage(stored)) return stored;
  } catch {
    // The website also works when browser storage is disabled.
  }
  return detectLanguage(navigator.languages);
}

void appI18n.changeLanguage(initialLanguage());

export function WebsiteProviders({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation("common");
  const closeLabel = t("actions.close");
  const theme = useMemo(() => createAppTheme(closeLabel), [closeLabel]);

  useEffect(() => {
    try {
      localStorage.setItem(languageStorageKey, i18n.language);
    } catch {
      // Keep the current language for this visit if storage is unavailable.
    }
  }, [i18n.language]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications />
      {children}
    </MantineProvider>
  );
}

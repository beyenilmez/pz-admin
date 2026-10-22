import { Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { AboutSection } from "@/features/settings/components/AboutSection";
import { DiagnosticsSection } from "@/features/settings/components/DiagnosticsSection";
import { PreferencesSection } from "@/features/settings/components/PreferencesSection";
import classes from "./SettingsPage.module.css";

export function SettingsPage() {
  const { t } = useTranslation("settings");
  return (
    <Stack className={classes.page} gap="md">
      <Title order={1}>{t("page.title")}</Title>
      <PreferencesSection />
      <DiagnosticsSection />
      <AboutSection />
    </Stack>
  );
}

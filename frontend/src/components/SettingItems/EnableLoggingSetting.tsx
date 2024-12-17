import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function EnableLoggingSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="enableLogging"
      label={t("settings.setting.logging.label")}
      description={t("settings.setting.logging.description")}
      requiresRestart
    />
  );
}

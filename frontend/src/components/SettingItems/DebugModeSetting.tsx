import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DebugModeSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="debugMode"
      label={t("settings.setting.debug_mode.label")}
      description={t("settings.setting.debug_mode.description")}
    />
  );
}

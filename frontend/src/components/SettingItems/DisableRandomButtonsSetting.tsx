import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DisableRandomButtonsSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="disableRandomButtons"
      label={t("settings.setting.disable_random_event_buttons.label")}
      description={t("settings.setting.disable_random_event_buttons.description")}
    />
  );
}

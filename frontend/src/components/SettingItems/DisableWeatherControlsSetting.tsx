import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DisableWeatherControlsSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="disableWeatherControlButtons"
      label={t("settings.setting.disable_weather_control_buttons.label")}
      description={t("settings.setting.disable_weather_control_buttons.description")}
    />
  );
}

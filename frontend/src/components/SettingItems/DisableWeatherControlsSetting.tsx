import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DisableWeatherControlsSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="disableWeatherControlButtons"
      label={t("Disable Weather Control Buttons")}
      description={t("Disables the weather control buttons to prevent misclicks")}
    />
  );
}

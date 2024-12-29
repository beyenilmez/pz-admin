import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DisableRandomButtonsSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="disableRandomButtons"
      label={t("Disable Random Event Buttons")}
      description={t("Disables the random event buttons to prevent misclicks")}
    />
  );
}

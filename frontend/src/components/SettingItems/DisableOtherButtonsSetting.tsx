import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DisableOtherButtonsSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="disableOtherButtons"
      label={t("settings.setting.disable_other_management_buttons.label")}
      description={t("settings.setting.disable_other_management_buttons.description")}
    />
  );
}

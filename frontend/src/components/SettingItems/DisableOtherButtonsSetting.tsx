import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";

export function DisableOtherButtonsSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="disableOtherButtons"
      label={t("Disable Other")}
      description={t("Disables the other category to prevent misclicks")}
    />
  );
}

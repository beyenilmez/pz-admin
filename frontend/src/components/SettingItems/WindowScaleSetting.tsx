import { useTranslation } from "react-i18next";
import { SliderConfig } from "./Presets/SliderConfig";

export function WindowScaleSetting() {
  const { t } = useTranslation();
  return (
    <SliderConfig
      configKey="windowScale"
      label={t("settings.setting.window_scale.label")}
      description={t("settings.setting.window_scale.description")}
      min={50}
      max={150}
      step={10}
      onSave={(value) => {
        document.documentElement.style.fontSize = value * (16 / 100) + "px";
      }}
    />
  );
}

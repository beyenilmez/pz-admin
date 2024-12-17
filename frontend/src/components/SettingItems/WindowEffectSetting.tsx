import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useConfig } from "@/contexts/config-provider";

export function WindowEffectSetting() {
  const { config, initialConfig, setConfigField } = useConfig();
  const { t } = useTranslation();

  const [{ isLoading, useWindowEffect }, setLoadingAndEffect] = useState<{
    isLoading: boolean;
    useWindowEffect: string;
  }>({ isLoading: true, useWindowEffect: "" });

  useEffect(() => {
    if (isLoading && config?.windowEffect !== undefined) {
      setLoadingAndEffect({
        isLoading: false,
        useWindowEffect: config.windowEffect.toString(),
      });
    }
  }, [config?.windowEffect]);

  const handleToggle = (number: number) => {
    setConfigField("windowEffect", number);
    setLoadingAndEffect((prev) => ({
      ...prev,
      useWindowEffect: number.toString(),
    }));
  };

  const windowEffectOptions = [
    {
      number: 1,
      label: t("settings.setting.window_effect.none"),
      aria: "No window effect",
    },
    {
      number: 0,
      label: t("settings.setting.window_effect.auto"),
      aria: "Auto window effect",
    },
    {
      number: 2,
      label: t("settings.setting.window_effect.mica"),
      aria: "Mica window effect",
    },
    {
      number: 3,
      label: t("settings.setting.window_effect.acrylic"),
      aria: "Acrylic window effect",
    },
    {
      number: 4,
      label: t("settings.setting.window_effect.tabbed"),
      aria: "Tabbed window effect",
    },
  ];

  return (
    <SettingsItem loading={isLoading} configKey="windowEffect" requiresRestart>
      <div>
        <SettingLabel>{t("settings.setting.window_effect.label")}</SettingLabel>
        <SettingDescription>
          {`${t("settings.setting.window_effect.description")} (${t(
            "settings.restart_the_app_for_changes_to_take_effect"
          )})`}
        </SettingDescription>
      </div>
      <SettingContent>
        <ToggleGroup type="single" value={useWindowEffect}>
          {windowEffectOptions.map(({ number, label, aria }) => (
            <ToggleGroupItem
              key={number}
              value={number.toString()}
              aria-label={aria}
              onClick={() => handleToggle(number)}
              className={
                number === initialConfig?.windowEffect
                  ? "font-bold text-shadow-xl shadow-foreground"
                  : ""
              }
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingContent>
    </SettingsItem>
  );
}

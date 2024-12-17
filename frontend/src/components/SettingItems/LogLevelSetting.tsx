import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useConfig } from "@/contexts/config-provider";

type LogLevels = {
  enableTrace: boolean;
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  enableFatal: boolean;
};

export function LogLevelSetting() {
  const { config, setConfigField } = useConfig();
  const { t } = useTranslation();
  const [state, setState] = useState<{
    isLoading: boolean;
    logLevels: LogLevels;
  }>({
    isLoading: true,
    logLevels: {
      enableTrace: false,
      enableDebug: false,
      enableInfo: false,
      enableWarn: false,
      enableError: false,
      enableFatal: false,
    },
  });

  useEffect(() => {
    if (state.isLoading && config) {
      const {
        enableTrace,
        enableDebug,
        enableInfo,
        enableWarn,
        enableError,
        enableFatal,
      } = config;
      if (
        enableTrace !== undefined &&
        enableDebug !== undefined &&
        enableInfo !== undefined &&
        enableWarn !== undefined &&
        enableError !== undefined &&
        enableFatal !== undefined
      ) {
        setState({
          isLoading: false,
          logLevels: {
            enableTrace,
            enableDebug,
            enableInfo,
            enableWarn,
            enableError,
            enableFatal,
          },
        });
      }
    }
  }, [config, state.isLoading]);

  const handleToggle = (level: keyof LogLevels) => {
    const newLogLevels = {
      ...state.logLevels,
      [level]: !state.logLevels[level],
    };
    setConfigField(level, newLogLevels[level]);
    setState({ ...state, logLevels: newLogLevels });
  };

  const activeLogLevels = Object.entries(state.logLevels)
    .filter(([, value]) => value)
    .map(([key]) => key);

  return (
    <SettingsItem
      loading={state.isLoading}
      configKey={Object.keys(state.logLevels) as (keyof LogLevels)[]}
      requiresRestart
    >
      <div>
        <SettingLabel>{t("settings.setting.log_levels.label")}</SettingLabel>
        <SettingDescription>
          {t("settings.setting.log_levels.description")}
        </SettingDescription>
      </div>
      <SettingContent>
        <ToggleGroup type="multiple" value={activeLogLevels}>
          {Object.keys(state.logLevels).map((level) => (
            <ToggleGroupItem
              key={level}
              value={level}
              aria-label={level}
              onClick={() => handleToggle(level as keyof LogLevels)}
            >
              {level.replace("enable", "")}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingContent>
    </SettingsItem>
  );
}

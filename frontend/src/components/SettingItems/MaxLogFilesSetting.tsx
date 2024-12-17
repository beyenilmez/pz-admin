import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { Input } from "@/components/ui/input";
import { useConfig } from "@/contexts/config-provider";

export function MaxLogFilesSetting() {
  const { config, setConfigField } = useConfig();
  const { t } = useTranslation();
  const [{ isLoading, maxLogFiles }, setState] = useState({
    isLoading: true,
    maxLogFiles: "",
  });

  useEffect(() => {
    if (isLoading && config?.maxLogFiles !== undefined) {
      setState({
        isLoading: false,
        maxLogFiles: config.maxLogFiles.toString(),
      });
    }
  }, [isLoading, config?.maxLogFiles]);

  const handleMaxLogFilesChange = (textValue: string) => {
    const parsedValue = parseInt(textValue);
    const value = isNaN(parsedValue)
      ? 20
      : Math.max(1, Math.min(10000, parsedValue));
    setConfigField("maxLogFiles", value);
    setState((prevState) => ({
      ...prevState,
      maxLogFiles: textValue === "" ? "" : value.toString(),
    }));
  };

  return (
    <SettingsItem loading={isLoading} configKey="maxLogFiles" requiresRestart>
      <div>
        <SettingLabel>{t("settings.setting.max_log_files.label")}</SettingLabel>
        <SettingDescription>
          {`${t("settings.setting.max_log_files.description")} (${t(
            "settings.restart_the_app_for_changes_to_take_effect"
          )})`}
        </SettingDescription>
      </div>
      <SettingContent>
        <Input
          type="number"
          placeholder="20"
          value={maxLogFiles}
          onChange={(e) => handleMaxLogFilesChange(e.target.value)}
          min={1}
          max={10000}
          onKeyDown={(e) => e.key.match(/[-+]/) && e.preventDefault()}
        />
      </SettingContent>
    </SettingsItem>
  );
}

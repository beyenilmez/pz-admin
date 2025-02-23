import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsItem, SettingContent, SettingDescription, SettingLabel } from "@/components/ui/settings-group";
import { Input } from "@/components/ui/input";
import { useConfig } from "@/contexts/config-provider";

export function RCONCheckIntervalSetting() {
  const { config, setConfigField } = useConfig();
  const { t } = useTranslation();
  const [{ isLoading, rconCheckInterval }, setState] = useState({
    isLoading: true,
    rconCheckInterval: "",
  });

  useEffect(() => {
    if (isLoading && config?.rconCheckInterval !== undefined) {
      setState({
        isLoading: false,
        rconCheckInterval: config.rconCheckInterval.toString(),
      });
    }
  }, [isLoading, config?.rconCheckInterval]);

  const handleRCONCheckIntervalChange = (textValue: string) => {
    const parsedValue = parseInt(textValue);
    const value = isNaN(parsedValue) ? 10 : Math.max(1, Math.min(86400, parsedValue));
    setConfigField("rconCheckInterval", value);
    setState((prevState) => ({
      ...prevState,
      rconCheckInterval: textValue === "" ? "" : value.toString(),
    }));
  };

  return (
    <SettingsItem loading={isLoading} configKey="rconCheckInterval">
      <div>
        <SettingLabel>{t("settings.setting.rcon_check_interval.label")}</SettingLabel>
        <SettingDescription>{`${t("settings.setting.rcon_check_interval.description")}`}</SettingDescription>
      </div>
      <SettingContent>
        <Input
          type="number"
          placeholder="10"
          value={rconCheckInterval}
          onChange={(e) => handleRCONCheckIntervalChange(e.target.value)}
          min={1}
          max={86400}
          onKeyDown={(e) => e.key.match(/[-+]/) && e.preventDefault()}
        />
      </SettingContent>
    </SettingsItem>
  );
}

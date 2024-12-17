import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/contexts/config-provider";
import { main } from "@/wailsjs/go/models";

interface SwitchConfigProps {
  configKey: keyof main.Config;
  label: string;
  description?: string;
  requiresRestart?: boolean;
}

export function SwitchConfig({
  configKey,
  label,
  description = "",
  requiresRestart = false,
}: SwitchConfigProps) {
  const { config, setConfigField } = useConfig();
  const { t } = useTranslation();
  const [{ isLoading, switchValue }, setState] = useState({
    isLoading: true,
    switchValue: false,
  });

  useEffect(() => {
    if (isLoading && config?.[configKey] !== undefined) {
      setState({ switchValue: config[configKey] as boolean, isLoading: false });
    }
  }, [isLoading, config, configKey]);

  const handleSwitch = (value: boolean) => {
    setConfigField(configKey, value);
    setState((prevState) => ({ ...prevState, switchValue: value }));
  };

  return (
    <SettingsItem
      loading={isLoading}
      configKey={configKey}
      requiresRestart={requiresRestart}
    >
      <div>
        <SettingLabel>{label}</SettingLabel>
        {description && (
          <SettingDescription>
            {description}
            {requiresRestart &&
              ` (${t("settings.restart_the_app_for_changes_to_take_effect")})`}
          </SettingDescription>
        )}
      </div>
      <SettingContent>
        <Switch
          checked={switchValue}
          onCheckedChange={() => handleSwitch(!switchValue)}
        />
      </SettingContent>
    </SettingsItem>
  );
}

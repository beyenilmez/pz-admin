import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { useConfig } from "@/contexts/config-provider";
import { main } from "@/wailsjs/go/models";
import { Slider } from "@/components/ui/my-slider";

interface SliderConfigProps {
  configKey: keyof main.Config;
  label: string;
  description?: string;
  requiresRestart?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onSave?: (value: number) => void;
  disabled?: boolean;
}

export function SliderConfig({
  configKey,
  label,
  description = "",
  requiresRestart = false,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onSave,
  disabled = false,
  ...rest
}: SliderConfigProps) {
  const { config, setConfigField } = useConfig();
  const { t } = useTranslation();
  const [{ isLoading, value }, setState] = useState({
    isLoading: true,
    value: 50,
  });

  useEffect(() => {
    if (isLoading && config?.[configKey] !== undefined) {
      setState({ value: config[configKey] as number, isLoading: false });
    }
  }, [isLoading, config, configKey]);

  const handleSliderChange = (value: number) => {
    setState((prevState) => ({ ...prevState, value }));
    onChange?.(value);
  };

  const handleSliderSave = () => {
    setConfigField(configKey, value);
    onSave?.(value);
  };

  return (
    <SettingsItem
      disabled={disabled}
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
        <div className="flex gap-2">
          <div>{min}%</div>
          <Slider
            onValueChange={(value) => handleSliderChange(value[0] as number)}
            onPointerUp={handleSliderSave}
            defaultValue={[value]}
            min={min}
            max={max}
            step={step}
            className={"w-64 cursor-pointer"}
            {...rest}
          />
          <div>{max}%</div>
          <div className="w-16 font-bold text-center">({value}%)</div>
        </div>
      </SettingContent>
    </SettingsItem>
  );
}

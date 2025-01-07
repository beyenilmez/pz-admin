import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SettingContent, SettingDescription, SettingLabel, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { StartRain, StartStorm, StopRain, StopWeather } from "@/wailsjs/go/main/App";
import { useConfig } from "@/contexts/config-provider";
import { useTranslation } from "react-i18next";

export function WeatherControl() {
  const { t } = useTranslation();
  const { config } = useConfig();

  const [rainIntensity, setRainIntensity] = useState<number>();
  const handleRainIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value);
    if (e.target.value !== "" && isNaN(value)) {
      return;
    }
    value = Math.min(Math.max(value, 1), 100);
    setRainIntensity(value);
  };

  const [stormDuration, setStormDuration] = useState<number>();
  const handleStormDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value);
    if (e.target.value !== "" && isNaN(value)) {
      return;
    }
    value = Math.max(value, 1);
    setStormDuration(value);
  };

  return (
    <div className="py-4">
      <h1
        className={`text-2xl font-semibold leading-none tracking-tight ${
          config?.disableWeatherControlButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        {t("admin_panel.tabs.management.weather.title")}
        <span className="text-sm text-warning ml-3"> {t("admin_panel.tabs.management.weather.warning")}</span>
      </h1>
      <SettingsGroup>
        <SettingsItem disabled={config?.disableWeatherControlButtons} className="pt-0">
          <div className="h-14 flex justify-end flex-col">
            <SettingLabel> {t("admin_panel.tabs.management.weather.start_rain.name")}</SettingLabel>
            <SettingDescription>{t("admin_panel.tabs.management.weather.start_rain.description")}</SettingDescription>
          </div>
          <SettingContent>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col items-center gap-1">
                <Label htmlFor="rain-intensity">{t("admin_panel.tabs.management.weather.start_rain.intensity")}</Label>
                <Input
                  className="text-center w-16"
                  id="rain-intensity"
                  type="number"
                  min="1"
                  max="100"
                  value={rainIntensity}
                  onChange={handleRainIntensityChange}
                />
              </div>
              <Button
                onClick={() => StartRain(rainIntensity || -1)}
                className="min-w-36"
                disabled={rainIntensity !== undefined && (rainIntensity < 1 || rainIntensity > 100)}
              >
                {t("admin_panel.tabs.management.weather.start_rain.name")}
              </Button>
            </div>
          </SettingContent>
        </SettingsItem>

        <SettingsItem disabled={config?.disableWeatherControlButtons}>
          <div className="h-14 flex justify-end flex-col">
            <SettingLabel> {t("admin_panel.tabs.management.weather.start_storm.name")}</SettingLabel>
            <SettingDescription>{t("admin_panel.tabs.management.weather.start_storm.description")}</SettingDescription>
          </div>
          <SettingContent>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col items-center gap-1">
                <Label htmlFor="storm-duration">{t("admin_panel.tabs.management.weather.start_storm.duration")}</Label>
                <Input
                  className="text-center w-16"
                  id="storm-duration"
                  type="number"
                  placeholder="24"
                  min="1"
                  value={stormDuration}
                  onChange={handleStormDurationChange}
                />
              </div>
              <Button
                onClick={() => StartStorm(stormDuration || -1)}
                className="min-w-36"
                disabled={stormDuration !== undefined && stormDuration < 1}
              >
                {t("admin_panel.tabs.management.weather.start_storm.name")}
              </Button>
            </div>
          </SettingContent>
        </SettingsItem>

        <SettingsGroup className="flex">
          <SettingsItem disabled={config?.disableWeatherControlButtons} className="flex-col justify-center border-none">
            <SettingContent>
              <Button onClick={StopRain} className="min-w-36" variant="destructive">
                {t("admin_panel.tabs.management.weather.stop_rain")}
              </Button>
            </SettingContent>
          </SettingsItem>

          <SettingsItem disabled={config?.disableWeatherControlButtons} className="flex-col justify-center border-none">
            <SettingContent>
              <Button onClick={StopWeather} className="min-w-36" variant="destructive">
                {t("admin_panel.tabs.management.weather.stop_weather")}
              </Button>
            </SettingContent>
          </SettingsItem>
        </SettingsGroup>
      </SettingsGroup>
    </div>
  );
}

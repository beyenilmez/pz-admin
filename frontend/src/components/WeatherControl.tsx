import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SettingContent, SettingDescription, SettingLabel, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { StartRain, StartStorm, StopRain, StopWeather } from "@/wailsjs/go/main/App";

export function WeatherControl() {
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
      <h1 className="text-2xl font-semibold leading-none tracking-tight">
        Weather<span className="text-sm text-warning ml-3">Reported to cause problems with weather cycles.</span>
      </h1>
      <SettingsGroup>
        <SettingsItem className="pt-0">
          <div className="h-14 flex justify-end flex-col">
            <SettingLabel>Start Rain</SettingLabel>
            <SettingDescription>Starts rain with an optional intensity of 1-100</SettingDescription>
          </div>
          <SettingContent>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col items-center gap-1">
                <Label htmlFor="rain-intensity">Intensity</Label>
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
                className="w-32"
                disabled={rainIntensity !== undefined && (rainIntensity < 1 || rainIntensity > 100)}
              >
                Start rain
              </Button>
            </div>
          </SettingContent>
        </SettingsItem>

        <SettingsItem>
          <div className="h-14 flex justify-end flex-col">
            <SettingLabel>Start Storm</SettingLabel>
            <SettingDescription>Starts a storm with an optional duration (in game hours)</SettingDescription>
          </div>
          <SettingContent>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col items-center gap-1">
                <Label htmlFor="storm-duration">Duration</Label>
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
                className="w-32"
                disabled={stormDuration !== undefined && stormDuration < 1}
              >
                Start storm
              </Button>
            </div>
          </SettingContent>
        </SettingsItem>

        <SettingsGroup className="flex">
          <SettingsItem className="flex-col justify-center">
            <SettingContent>
              <div className="flex gap-2 items-end">
                <Button onClick={StopRain} className="w-32" variant="destructive">
                  Stop rain
                </Button>
              </div>
            </SettingContent>
          </SettingsItem>

          <SettingsItem className="flex-col justify-center">
            <SettingContent>
              <div className="flex gap-2 items-end">
                <Button onClick={StopWeather} className="w-32" variant="destructive">
                  Stop weather
                </Button>
              </div>
            </SettingContent>
          </SettingsItem>
        </SettingsGroup>
      </SettingsGroup>
    </div>
  );
}

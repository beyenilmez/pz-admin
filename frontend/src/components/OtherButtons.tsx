import { Alarm, CheckModsNeedUpdate } from "@/wailsjs/go/main/App";
import { Button } from "./ui/button";
import { SettingContent, SettingDescription, SettingLabel, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { useConfig } from "@/contexts/config-provider";

export function OtherButtons() {
  const { config } = useConfig();

  return (
    <div className="py-4">
      <h1
        className={`text-2xl font-semibold leading-none tracking-tight ${
          config?.disableOtherButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        Other
      </h1>
      <SettingsGroup>
        <SettingsItem disabled={config?.disableOtherButtons}>
          <div className="-flex justify-end flex-col">
            <SettingLabel>Check mod updates</SettingLabel>
            <SettingDescription>
              Checks whether a mod has been updated. Writes answer to log file and the chat.
            </SettingDescription>
          </div>
          <SettingContent>
            <Button onClick={CheckModsNeedUpdate} className="w-52">
              Check mod updates
            </Button>
          </SettingContent>
        </SettingsItem>

        <SettingsItem disabled={config?.disableOtherButtons} className="border-none">
          <div className="flex justify-end flex-col">
            <SettingLabel>Alarm</SettingLabel>
            <SettingDescription>Sound a building alarm at the Admin's position. (Must be in a room)</SettingDescription>
          </div>
          <SettingContent>
            <Button onClick={Alarm} className="w-52">
              Alarm
            </Button>
          </SettingContent>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

import { Alarm, CheckModsNeedUpdate } from "@/wailsjs/go/main/App";
import { Button } from "./ui/button";
import { SettingContent, SettingDescription, SettingLabel, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { useConfig } from "@/contexts/config-provider";
import { useTranslation } from "react-i18next";

export function OtherButtons() {
  const { t } = useTranslation();
  const { config } = useConfig();

  return (
    <div className="py-4">
      <h1
        className={`text-2xl font-semibold leading-none tracking-tight ${
          config?.disableOtherButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        {t("admin_panel.tabs.management.other.title")}
      </h1>
      <SettingsGroup>
        <SettingsItem disabled={config?.disableOtherButtons}>
          <div className="-flex justify-end flex-col">
            <SettingLabel>{t("admin_panel.tabs.management.other.check_mod_updates.name")}</SettingLabel>
            <SettingDescription>
              {t("admin_panel.tabs.management.other.check_mod_updates.description")}
            </SettingDescription>
          </div>
          <SettingContent>
            <Button onClick={CheckModsNeedUpdate} className="min-w-52">
              {t("admin_panel.tabs.management.other.check_mod_updates.name")}
            </Button>
          </SettingContent>
        </SettingsItem>

        <SettingsItem disabled={config?.disableOtherButtons} className="border-none">
          <div className="flex justify-end flex-col">
            <SettingLabel>{t("admin_panel.tabs.management.other.alarm.name")}</SettingLabel>
            <SettingDescription>{t("admin_panel.tabs.management.other.alarm.description")}</SettingDescription>
          </div>
          <SettingContent>
            <Button onClick={Alarm} className="min-w-52">
              {t("admin_panel.tabs.management.other.alarm.name")}
            </Button>
          </SettingContent>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { LocaleSetting } from "./SettingItems/LocaleSetting";
import { ThemeSetting } from "./SettingItems/ThemeSetting";
import { SettingsGroup } from "./ui/settings-group";
import { UseSystemTitleBarSetting } from "./SettingItems/UseSystemTitleBarSetting";
import { WindowScaleSetting } from "./SettingItems/WindowScaleSetting";
import { MaxLogFilesSetting } from "./SettingItems/MaxLogFilesSetting";
import { EnableLoggingSetting } from "./SettingItems/EnableLoggingSetting";
import { LogLevelSetting } from "./SettingItems/LogLevelSetting";
import { ImportExportSetting } from "./SettingItems/ImportExportSetting";
import { WindowEffectSetting } from "./SettingItems/WindowEffectSetting";
import { WindowOpacitySetting } from "./SettingItems/WindowOpacitySetting";
import { SaveWindowStatusSetting } from "./SettingItems/SaveWindowStatusSetting";
import { CheckForUpdatesSetting } from "./SettingItems/CheckForUpdatesSetting";
import { UpdateSetting } from "./SettingItems/UpdateSetting";
import { useEffect, useState } from "react";
import { useStorage } from "@/contexts/storage-provider";
import { ColorSchemeSetting } from "./SettingItems/ColorSchemeSetting";
import { RCONCheckIntervalSetting } from "./SettingItems/RCONCheckIntervalSetting";

export default function Settings() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("general");
  const { getValue, setValue } = useStorage();

  useEffect(() => {
    setTab(getValue("settings") || "general");
  }, [getValue("settings")]);

  useEffect(() => {
    setValue("path2", tab);
  }, [tab]);

  return (
    <Tabs value={tab} className="flex flex-row w-full h-full">
      <TabsList className="flex-col justify-start px-2 rounded-none w-fit h-full">
        <TabsTrigger value="general" onClick={() => setTab("general")} className="px-12 py-2 w-full">
          {t("settings.categories.general")}
        </TabsTrigger>
        <TabsTrigger value="app" onClick={() => setTab("app")} className="px-12 py-2 w-full">
          {t("settings.categories.application")}
        </TabsTrigger>
        <TabsTrigger value="rcon" onClick={() => setTab("rcon")} className="px-12 py-2 w-full">
          {t("RCON")}
        </TabsTrigger>
        <TabsTrigger value="advanced" onClick={() => setTab("advanced")} className="px-12 py-2 w-full">
          {t("settings.categories.advanced")}
        </TabsTrigger>
        <TabsTrigger value="update" onClick={() => setTab("update")} className="px-12 py-2 w-full">
          {t("settings.categories.update")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="w-full h-[calc(100vh-5.5rem)] overflow-y-auto">
        <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
          <LocaleSetting />
          <ColorSchemeSetting />
          <ThemeSetting />
        </SettingsGroup>
      </TabsContent>
      <TabsContent value="app" className="w-full h-[calc(100vh-5.5rem)] overflow-y-auto">
        <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
          <ThemeSetting />
          <ColorSchemeSetting />
          <WindowEffectSetting />
          <WindowOpacitySetting />
          <WindowScaleSetting />
          {false && <UseSystemTitleBarSetting />}
          <SaveWindowStatusSetting />
        </SettingsGroup>
      </TabsContent>
      <TabsContent value="rcon" className="w-full h-[calc(100vh-5.5rem)] overflow-y-auto">
        <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
          <RCONCheckIntervalSetting />
        </SettingsGroup>
      </TabsContent>
      {false && (
        <TabsContent value="system" className="w-full h-[calc(100vh-5.5rem)] overflow-y-auto">
          Edit your system settings here.
        </TabsContent>
      )}
      <TabsContent value="advanced" className="w-full">
        <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
          <EnableLoggingSetting />
          <LogLevelSetting />
          <MaxLogFilesSetting />
          <ImportExportSetting />
        </SettingsGroup>
      </TabsContent>
      <TabsContent value="update" className="w-full h-[calc(100vh-5.5rem)] overflow-y-auto">
        <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
          <CheckForUpdatesSetting />
          <UpdateSetting />
        </SettingsGroup>
      </TabsContent>
    </Tabs>
  );
}

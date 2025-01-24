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
import { ScrollArea } from "./ui/scroll-area";
import { DisableWeatherControlsSetting } from "./SettingItems/DisableWeatherControlsSetting";
import { DisableRandomButtonsSetting } from "./SettingItems/DisableRandomButtonsSetting";
import { DisableOtherButtonsSetting } from "./SettingItems/DisableOtherButtonsSetting";
import { DebugModeSetting } from "./SettingItems/DebugModeSetting";
import { useConfig } from "@/contexts/config-provider";
import { useOs } from "@/contexts/os-provider";

export default function Settings() {
  const { t } = useTranslation();
  const { config } = useConfig();
  const { os } = useOs();
  const [tab, setTab] = useState("general");
  const { getValue, setValue } = useStorage();

  useEffect(() => {
    setTab(getValue("settings") || "general");
  }, [getValue("settings")]);

  useEffect(() => {
    setValue("path2", tab);
  }, [tab]);

  return (
    <Tabs value={tab} className="flex w-full h-full">
      <TabsList className="h-full backdrop-brightness-0 rounded-none p-2 flex flex-col justify-start w-80">
        <TabsTrigger value="general" onClick={() => setTab("general")} className="px-12 py-2 w-full">
          {t("settings.categories.general")}
        </TabsTrigger>
        <TabsTrigger value="app" onClick={() => setTab("app")} className="px-12 py-2 w-full">
          {t("settings.categories.application")}
        </TabsTrigger>
        <TabsTrigger value="rcon" onClick={() => setTab("rcon")} className="px-12 py-2 w-full">
          {t("settings.categories.rcon")}
        </TabsTrigger>
        <TabsTrigger value="advanced" onClick={() => setTab("advanced")} className="px-12 py-2 w-full">
          {t("settings.categories.advanced")}
        </TabsTrigger>
        {(os === "windows" || os === "linux") && (
          <TabsTrigger value="update" onClick={() => setTab("update")} className="px-12 py-2 w-full">
            {t("settings.categories.update")}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent
        value="general"
        className={`w-full ${config?.useSystemTitleBar ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-5.5rem)]"}`}
      >
        <ScrollArea className="h-full w-full overflow-auto">
          <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
            <LocaleSetting />
            <ColorSchemeSetting />
            <ThemeSetting />
          </SettingsGroup>
        </ScrollArea>
      </TabsContent>
      <TabsContent
        value="app"
        className={`w-full ${config?.useSystemTitleBar ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-5.5rem)]"}`}
      >
        <ScrollArea className="h-full w-full overflow-auto">
          <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
            <ThemeSetting />
            <ColorSchemeSetting />
            {os === "windows" && <WindowEffectSetting />}
            {os !== "linux" && <WindowOpacitySetting />}
            <WindowScaleSetting />
            <UseSystemTitleBarSetting />
            <SaveWindowStatusSetting />
          </SettingsGroup>
        </ScrollArea>
      </TabsContent>
      <TabsContent
        value="rcon"
        className={`w-full ${config?.useSystemTitleBar ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-5.5rem)]"}`}
      >
        <ScrollArea className="h-full w-full overflow-auto">
          <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
            <RCONCheckIntervalSetting />
            <DisableWeatherControlsSetting />
            <DisableRandomButtonsSetting />
            <DisableOtherButtonsSetting />
          </SettingsGroup>
        </ScrollArea>
      </TabsContent>
      {false && (
        <TabsContent
          value="system"
          className={`w-full ${config?.useSystemTitleBar ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-5.5rem)]"}`}
        >
          Edit your system settings here.
        </TabsContent>
      )}
      <TabsContent value="advanced" className="w-full">
        <ScrollArea className="h-full w-full overflow-auto">
          <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
            <EnableLoggingSetting />
            <LogLevelSetting />
            <MaxLogFilesSetting />
            <ImportExportSetting />
            {process.env.NODE_ENV === "development" && <DebugModeSetting />}
          </SettingsGroup>
        </ScrollArea>
      </TabsContent>
      <TabsContent
        value="update"
        className={`w-full ${config?.useSystemTitleBar ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-5.5rem)]"}`}
      >
        <ScrollArea className="h-full w-full overflow-auto">
          <SettingsGroup className="flex flex-col items-start px-4 py-2 w-full h-full">
            <CheckForUpdatesSetting />
            <UpdateSetting />
          </SettingsGroup>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

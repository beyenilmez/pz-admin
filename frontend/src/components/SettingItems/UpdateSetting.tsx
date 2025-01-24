import { useEffect, useState } from "react";
import { CheckForUpdate, Update } from "@/wailsjs/go/main/App";
import { main } from "@/wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { SettingContent, SettingDescription, SettingLabel, SettingsItem } from "@/components/ui/settings-group";
import { ArrowRight, RefreshCw } from "lucide-react";
import { GetConfigField } from "@/wailsjs/go/main/App";
import { useTranslation } from "react-i18next";
import { useStorage } from "@/contexts/storage-provider";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrowserOpenURL } from "@/wailsjs/runtime/runtime";

export function UpdateSetting() {
  const { t } = useTranslation();
  const { getValue } = useStorage();

  const [updateInfo, setUpdateInfo] = useState<main.UpdateInfo>(main.UpdateInfo.createFrom({}));

  const [lastUpdateCheck, setLastUpdateCheck] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    handleCheckForUpdate();
  }, []);

  useEffect(() => {
    // Update last update check timestamp from config
    GetConfigField("LastUpdateCheck").then((value) => setLastUpdateCheck(value as number));
  }, [updateInfo]);

  useEffect(() => {
    // Automatic update trigger from argument
    const storedUpdate = getValue("update");
    if (storedUpdate && !isChecking && !isUpdating) {
      setIsUpdating(true);
      Update(storedUpdate).finally(() => setIsUpdating(false));
    }
  }, [getValue]);

  const handleCheckForUpdate = () => {
    if (!isUpdating) {
      // Start the spinner and set a minimum duration for the animation
      setIsChecking(true);
      const spinMinDuration = new Promise((resolve) => setTimeout(resolve, 500));

      // Check for updates and update state accordingly
      const updateJob = CheckForUpdate().then(setUpdateInfo);

      // Wait for both the minimum spin duration and the update check to complete
      Promise.all([spinMinDuration, updateJob]).finally(() => setIsChecking(false));
    }
  };

  const handleUpdate = () => {
    // Perform update based on admin privileges
    setIsUpdating(true);
    const updater = Update;
    updater(updateInfo.downloadUrl).finally(() => setIsUpdating(false));
  };

  const formatDate = (timestamp: number) => {
    // Format timestamp into readable date string
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <SettingsItem disabled={isChecking || isUpdating} vertical>
      <div className="flex justify-between">
        <SettingContent>
          <div className="flex items-center gap-2">
            <RefreshCw className={`p-3 -ml-1.5 w-14 h-14 ${isChecking || isUpdating ? "animate-spin" : ""}`} />
            <div className="flex flex-col justify-center">
              <SettingLabel className="flex items-center gap-2">
                {updateInfo.updateAvailable
                  ? t("settings.setting.update.update_available")
                  : t("settings.setting.update.no_updates_available")}
                {lastUpdateCheck && lastUpdateCheck !== 0 && (
                  <SettingDescription>
                    {" (" + t("settings.setting.update.last_checked") + ": " + formatDate(lastUpdateCheck) + ")"}
                  </SettingDescription>
                )}
              </SettingLabel>
              <SettingDescription>
                {updateInfo.updateAvailable && (
                  <div className="flex items-center gap-1">
                    <span className="font-bold">v{updateInfo.currentVersion}</span>
                    <ArrowRight className="-mb-1 w-4 h-4" />
                    {updateInfo.latestVersion}
                  </div>
                )}
                {!updateInfo.updateAvailable && <span className="font-bold">v{updateInfo.currentVersion}</span>}
                {!updateInfo.updateAvailable && <span>&#8203;</span>}
              </SettingDescription>
            </div>
          </div>
        </SettingContent>
        <div className="flex items-center gap-2">
          {updateInfo.updateAvailable && (
            <Button onClick={handleUpdate}>
              {isUpdating ? t("settings.setting.update.updating") : t("settings.setting.update.update")}
            </Button>
          )}
          <Button onClick={handleCheckForUpdate}>{t("settings.setting.update.check_for_updates")}</Button>
        </div>
      </div>
      <div className="p-1.5 pt-0" hidden={!updateInfo.updateAvailable}>
        <Button
          variant={"link"}
          className="p-0 m-0 text-md text-foreground"
          asChild
          onClick={() => {
            BrowserOpenURL(updateInfo.releaseUrl);
          }}
        >
          <SettingLabel className="cursor-pointer">{updateInfo.name} </SettingLabel>
        </Button>

        <SettingDescription>
          <Markdown
            className="ml-2"
            components={{
              a: ({ href, children }) => (
                <a
                  onClick={() => {
                    BrowserOpenURL(href!);
                  }}
                  className={"hover:underline cursor-pointer text-primary font-semibold"}
                >
                  {children}
                </a>
              ),
            }}
            remarkPlugins={[remarkGfm]}
          >
            {updateInfo.releaseNotes}
          </Markdown>
        </SettingDescription>
      </div>
    </SettingsItem>
  );
}

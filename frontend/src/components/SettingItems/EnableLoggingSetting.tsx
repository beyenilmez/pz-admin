import { useTranslation } from "react-i18next";
import { SwitchConfig } from "./Presets/SwitchConfig";
import { Button } from "../ui/button";
import { FolderOpen } from "lucide-react";
import { OpenLogFolder } from "@/wailsjs/go/main/App";

export function EnableLoggingSetting() {
  const { t } = useTranslation();

  return (
    <SwitchConfig
      configKey="enableLogging"
      label={t("settings.setting.logging.label")}
      description={t("settings.setting.logging.description")}
      requiresRestart
    >
      <Button
        variant={"outline"}
        size={"icon"}
        onClick={() => {
          OpenLogFolder();
        }}
      >
        <FolderOpen className="w-4 h-4" />
      </Button>
    </SwitchConfig>
  );
}

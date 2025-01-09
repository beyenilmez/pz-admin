import { useRcon } from "@/contexts/rcon-provider";
import { Button } from "./ui/button";
import { SettingContent, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { useConfig } from "@/contexts/config-provider";
import { Chopper, Gunshot, RandomLightning, RandomThunder } from "@/wailsjs/go/main/App";
import { useTranslation } from "react-i18next";

export function RandomButtons() {
  const { t } = useTranslation();

  const { config } = useConfig();
  const { players } = useRcon();

  const onlinePlayers = players.filter((p) => p.online);

  return (
    <div className="py-4">
      <h1
        className={`text-2xl font-semibold leading-none tracking-tight ${
          config?.disableRandomButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        {t("admin_panel.tabs.management.random.title")}
      </h1>
      <h2
        className={`text-sm text-muted-foreground ${
          config?.disableRandomButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        {t("admin_panel.tabs.management.random.description")}
      </h2>
      <h2
        className={`font-semibold text-xs text-muted-foreground mt-1.5 ${
          config?.disableRandomButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        {t("admin_panel.tabs.management.random.online_players", {
          players:
            onlinePlayers.length === 0
              ? t("admin_panel.tabs.management.random.no_players")
              : onlinePlayers.map((p) => p.name).join(", "),
        })}
      </h2>
      <SettingsGroup className="flex">
        <SettingsItem disabled={config?.disableRandomButtons} className="flex-col justify-center border-none">
          <SettingContent className="w-full">
            <div className="flex gap-2 items-start justify-start w-full">
              <Button
                className="min-w-36"
                tooltip={t("admin_panel.tabs.management.random.chopper.tooltip")}
                disabled={!config?.debugMode && onlinePlayers.length === 0}
                onClick={Chopper}
              >
                {t("admin_panel.tabs.management.random.chopper.name")}
              </Button>
              <Button
                className="min-w-36"
                tooltip={t("admin_panel.tabs.management.random.gunshot.tooltip")}
                disabled={!config?.debugMode && onlinePlayers.length === 0}
                onClick={Gunshot}
              >
                {t("admin_panel.tabs.management.random.gunshot.name")}
              </Button>
              <Button
                className="min-w-36"
                tooltip={t("admin_panel.tabs.management.random.lightning.tooltip")}
                disabled={!config?.debugMode && onlinePlayers.length === 0}
                onClick={RandomLightning}
              >
                {t("admin_panel.tabs.management.random.lightning.name")}
              </Button>
              <Button
                className="min-w-36"
                tooltip={t("admin_panel.tabs.management.random.thunder.tooltip")}
                disabled={!config?.debugMode && onlinePlayers.length === 0}
                onClick={RandomThunder}
              >
                {t("admin_panel.tabs.management.random.thunder.name")}
              </Button>
            </div>
          </SettingContent>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

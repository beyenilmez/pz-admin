import { useRcon } from "@/contexts/rcon-provider";
import { Button } from "./ui/button";
import { SettingContent, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { useConfig } from "@/contexts/config-provider";
import { Chopper, Gunshot, RandomLightning, RandomThunder } from "@/wailsjs/go/main/App";

export function RandomButtons() {
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
        Random
      </h1>
      <h2
        className={`text-sm text-muted-foreground ${
          config?.disableRandomButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        Triggers the clicked event on a random player
      </h2>
      <h2
        className={`font-semibold text-xs text-muted-foreground mt-1.5 ${
          config?.disableRandomButtons ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        Online Players: {onlinePlayers.length === 0 ? "None" : onlinePlayers.map((p) => p.name).join(", ")}
      </h2>
      <SettingsGroup className="flex">
        <SettingsItem disabled={config?.disableRandomButtons} className="flex-col justify-center border-none">
          <SettingContent className="w-full">
            <div className="flex gap-2 items-start justify-start w-full">
              <Button
                className="w-32"
                tooltip="Place a helicopter event on a random player"
                disabled={onlinePlayers.length === 0}
                onClick={Chopper}
              >
                Chopper
              </Button>
              <Button
                className="w-32"
                tooltip="Place a gunshot sound on a random player"
                disabled={onlinePlayers.length === 0}
                onClick={Gunshot}
              >
                Gunshot
              </Button>
              <Button
                className="w-32"
                tooltip="Trigger a lightning on a random player"
                disabled={onlinePlayers.length === 0}
                onClick={RandomLightning}
              >
                Lightning
              </Button>
              <Button
                className="w-32"
                tooltip="Trigger a thunder on a random player"
                disabled={onlinePlayers.length === 0}
                onClick={RandomThunder}
              >
                Thunder
              </Button>
            </div>
          </SettingContent>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

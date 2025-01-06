import React, { useState, useRef, useEffect } from "react";
import { useRcon } from "@/contexts/rcon-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

const commands = [
  "additem",
  "adduser",
  "addvehicle",
  "addxp",
  "alarm",
  "banid",
  "banuser",
  "changeoption",
  "checkModsNeedUpdate",
  "chopper",
  "clear",
  "createhorde",
  "godmod",
  "grantadmin",
  "gunshot",
  "help",
  "invisible",
  "kick",
  "lightning",
  "log",
  "noclip",
  "players",
  "quit",
  "releasesafehouse",
  "reloadlua",
  "reloadoptions",
  "removeadmin",
  "removeuserfromwhitelist",
  "replay",
  "save",
  "servermsg",
  "setaccesslevel",
  "showoptions",
  "startrain",
  "startstorm",
  "stats",
  "stoprain",
  "stopweather",
  "teleport",
  "teleportto",
  "thunder",
  "unbanid",
  "unbanuser",
  "voiceban",
];

const options = [
  "AdminSafehouse",
  "AllowCoop",
  "AllowDestructionBySledgehammer",
  "AllowNonAsciiUsername",
  "AnnounceDeath",
  "AntiCheatProtectionType1",
  "AntiCheatProtectionType10",
  "AntiCheatProtectionType11",
  "AntiCheatProtectionType12",
  "AntiCheatProtectionType13",
  "AntiCheatProtectionType14",
  "AntiCheatProtectionType15",
  "AntiCheatProtectionType15ThresholdMultiplier",
  "AntiCheatProtectionType16",
  "AntiCheatProtectionType17",
  "AntiCheatProtectionType18",
  "AntiCheatProtectionType19",
  "AntiCheatProtectionType2",
  "AntiCheatProtectionType20",
  "AntiCheatProtectionType20ThresholdMultiplier",
  "AntiCheatProtectionType21",
  "AntiCheatProtectionType22",
  "AntiCheatProtectionType22ThresholdMultiplier",
  "AntiCheatProtectionType23",
  "AntiCheatProtectionType24",
  "AntiCheatProtectionType24ThresholdMultiplier",
  "AntiCheatProtectionType2ThresholdMultiplier",
  "AntiCheatProtectionType3",
  "AntiCheatProtectionType3ThresholdMultiplier",
  "AntiCheatProtectionType4",
  "AntiCheatProtectionType4ThresholdMultiplier",
  "AntiCheatProtectionType5",
  "AntiCheatProtectionType6",
  "AntiCheatProtectionType7",
  "AntiCheatProtectionType8",
  "AntiCheatProtectionType9",
  "AntiCheatProtectionType9ThresholdMultiplier",
  "AutoCreateUserInWhiteList",
  "BackupsCount",
  "BackupsOnStart",
  "BackupsOnVersionChange",
  "BackupsPeriod",
  "BanKickGlobalSound",
  "BloodSplatLifespanDays",
  "CarEngineAttractionModifier",
  "ChatStreams",
  "ClientActionLogs",
  "ClientCommandFilter",
  "ConstructionPreventsLootRespawn",
  "DefaultPort",
  "DenyLoginOnOverloadedServer",
  "DisableRadioAdmin",
  "DisableRadioGM",
  "DisableRadioInvisible",
  "DisableRadioModerator",
  "DisableRadioOverseer",
  "DisableRadioStaff",
  "DisableSafehouseWhenPlayerConnected",
  "DiscordEnable",
  "DisplayUserName",
  "DoLuaChecksum",
  "DropOffWhiteListAfterDeath",
  "Faction",
  "FactionDaySurvivedToCreate",
  "FactionPlayersRequiredForTag",
  "FastForwardMultiplier",
  "GlobalChat",
  "HidePlayersBehindYou",
  "HoursForLootRespawn",
  "ItemNumbersLimitPerContainer",
  "KickFastPlayers",
  "KnockedDownAllowed",
  "LoginQueueConnectTimeout",
  "LoginQueueEnabled",
  "Map",
  "MapRemotePlayerVisibility",
  "MaxAccountsPerUser",
  "MaxItemsForLootRespawn",
  "MaxPlayers",
  "MinutesPerPage",
  "Mods",
  "MouseOverToSeeDisplayName",
  "NoFire",
  "Open",
  "PVP",
  "PVPFirearmDamageModifier",
  "PVPMeleeDamageModifier",
  "PVPMeleeWhileHitReaction",
  "PauseEmpty",
  "PerkLogs",
  "PingLimit",
  "PlayerBumpPlayer",
  "PlayerRespawnWithOther",
  "PlayerRespawnWithSelf",
  "PlayerSafehouse",
  "Public",
  "PublicDescription",
  "PublicName",
  "RemovePlayerCorpsesOnCorpseRemoval",
  "ResetID",
  "SafeHouseRemovalTime",
  "SafehouseAllowFire",
  "SafehouseAllowLoot",
  "SafehouseAllowNonResidential",
  "SafehouseAllowRespawn",
  "SafehouseAllowTrepass",
  "SafehouseDaySurvivedToClaim",
  "SafetyCooldownTimer",
  "SafetySystem",
  "SafetyToggleTimer",
  "SaveWorldEveryMinutes",
  "ServerPlayerID",
  "ShowFirstAndLastName",
  "ShowSafety",
  "SledgehammerOnlyInSafehouse",
  "SleepAllowed",
  "SleepNeeded",
  "SneakModeHideFromOtherPlayers",
  "SpawnItems",
  "SpawnPoint",
  "SpeedLimit",
  "SteamScoreboard",
  "SteamVAC",
  "TrashDeleteAll",
  "UDPPort",
  "UPnP",
  "Voice3D",
  "VoiceEnable",
  "VoiceMaxDistance",
  "VoiceMinDistance",
  "WorkshopItems",
  "server_browser_announced_ip",
  "ServerWelcomeMessage",
];

const TerminalPage: React.FC = () => {
  const { sendCommand, players } = useRcon();

  const playerNames = players.map((player) => player.name);

  const commandsMap: { [key: string]: string[] } = {
    empty: commands,
    help: commands,
    banuser: playerNames,
    unbanuser: playerNames,
    changeoption: options,
  };

  const [output, setOutput] = useState<{ type: "command" | "response" | "info" | "error"; line: string }[]>([
    { type: "info", line: "Welcome, type 'help' for commands or 'cls' to clear the terminal." },
    { type: "info", line: "You can use tab for auto-completion and up/down keys to navigate command history." },
  ]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tabMatches, setTabMatches] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    inputRef.current?.focus();
    scrollToBottom();
  }, [output]);

  const addOutput = (line: string, type: "command" | "response" | "info" | "error") => {
    const newLines = line.split("\n").map((l) => ({ type, line: l }));
    setOutput((prev) => [...prev, ...newLines]);
  };

  const moveCommandToEnd = (command: string) => {
    setCommandHistory((prev) => {
      const filteredHistory = prev.filter((cmd) => cmd !== command);
      return [...filteredHistory, command];
    });
  };

  const handleTabCompletion = () => {
    const trimmedInput = currentInput.trim();
    const words = trimmedInput.split(" ");
    const baseCommand = words[0]; // The first word is the base command
    const currentWord = words[words.length - 1];

    const suggestions =
      words.length === 1
        ? commandsMap["empty"] // Suggest commands for the base command
        : commandsMap[baseCommand] || []; // Suggest values for a specific command

    if (tabIndex === -1) {
      const matches = suggestions.filter((item) => item.startsWith(currentWord));
      if (matches.length > 0) {
        setTabMatches(matches);
        setTabIndex(0);
        setCurrentInput((words.slice(0, -1).join(" ") + " " + matches[0]).trim());
      }
    } else {
      const newIndex = (tabIndex + 1) % tabMatches.length;
      setTabIndex(newIndex);
      setCurrentInput((words.slice(0, -1).join(" ") + " " + tabMatches[newIndex]).trim());
    }
  };

  const resetTabCompletion = (value: string) => {
    setCurrentInput(value);
    setTabMatches([]);
    setTabIndex(-1);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentInput.trim()) {
      const command = currentInput.trim();
      moveCommandToEnd(command);
      addOutput(`> ${command}`, "command");
      resetTabCompletion("");
      setHistoryIndex(-1);

      try {
        if (command === "cls") {
          setOutput([]);
        } else {
          const { response, error } = await sendCommand(command);
          if (response && !error) {
            addOutput(response, "response");
          } else {
            addOutput(error || "No response.", "error");
          }
        }
      } catch (error) {
        addOutput(`Error: ${error}`, "error");
      }

      scrollToBottom();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        resetTabCompletion(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > -1 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        resetTabCompletion(commandHistory[newIndex]);
      } else if (historyIndex === commandHistory.length - 1) {
        setHistoryIndex(-1);
        resetTabCompletion("");
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      handleTabCompletion();
    }

    if (e.key === "Escape") {
      resetTabCompletion("");
      setHistoryIndex(-1);
    }
  };

  return (
    <div
      className="w-[calc(100vw-16rem)] h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 font-mono p-2 pb-1"
      onClick={() => inputRef.current?.focus()}
    >
      <ScrollArea className="h-[calc(100%-2rem)] overflow-auto pr-4">
        <div>
          {output.map((entry, index) => (
            <div
              key={index}
              className={`break-words whitespace-pre-wrap w-[calc(100vw-18rem)] ${
                entry.type === "command"
                  ? "dark:text-green-400 text-green-900 font-semibold"
                  : entry.type === "response"
                  ? "dark:text-green-700 text-green-600"
                  : entry.type === "info"
                  ? "text-blue-500"
                  : "text-red-500"
              }`}
            >
              {entry.line}
            </div>
          ))}
          <div ref={scrollRef}></div>
        </div>
      </ScrollArea>
      <div className="flex">
        <span className="dark:text-green-400 text-green-900 mr-2 h-[2rem] flex items-center font-semibold">$</span>
        <input
          ref={inputRef}
          type="text"
          spellCheck="false"
          value={currentInput}
          onChange={(e) => resetTabCompletion(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none border-none dark:text-green-400 text-green-900 h-[2rem]"
          autoFocus
        />
      </div>
    </div>
  );
};

export default TerminalPage;

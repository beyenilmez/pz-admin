export type Option = {
  FieldName: string;
  Type:
    | "String"
    | "Text"
    | "Integer"
    | "Double"
    | "Boolean"
    | "Information"
    | "ServerWelcomeMessage"
    | "Choice"
    | "SpawnItems";
  Default?: boolean | number | string;
  Range?: {
    Min: number;
    Max: number;
  };
  DisabledValue?: boolean | number | string;
  Requirements?: {
    FieldName: string;
    FieldValue: boolean | number | string;
  };
  Choices?: {
    Name: string;
    Value: boolean | number | string;
  }[];
  Keywords: string;
};

export type Category = {
  name: string;
  options: Option[];
};

export type Options = {
  categories: Category[];
};

export const options: Options = {
  categories: [
    {
      name: "General",
      options: [
        {
          FieldName: "AllowCoop",
          Type: "Boolean",
          Default: true,
          Keywords: "co-op,splitscreen,AllowCoop",
        },
        {
          FieldName: "AllowNonAsciiUsername",
          Type: "Boolean",
          Default: false,
          Keywords: "non,ascii,username,AllowNonAsciiUsername",
        },
        {
          FieldName: "AnnounceDeath",
          Type: "Boolean",
          Default: false,
          Keywords: "announce,death,AnnounceDeath",
        },
        {
          FieldName: "BanKickGlobalSound",
          Type: "Boolean",
          Default: true,
          Keywords: "ban,kick,message,globalsound,BanKickGlobalSound",
        },
        {
          FieldName: "ClientActionLogs",
          Type: "String",
          Default: "ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;",
          Keywords: "action,logs,ClientActionLogs",
        },
        {
          FieldName: "ClientCommandFilter",
          Type: "String",
          Default: "-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart",
          Keywords: "command,filter,ClientCommandFilter",
        },
        {
          FieldName: "DefaultPort",
          Type: "Integer",
          Default: 16261,
          Keywords: "port",
          Range: {
            Min: 0,
            Max: 65535,
          },
        },
        {
          FieldName: "DenyLoginOnOverloadedServer",
          Type: "Boolean",
          Default: true,
          Keywords: "login,deny,denial,overload,DenyLoginOnOverloadedServer",
        },
        {
          FieldName: "Map",
          Type: "String",
          Default: "Muldraugh, KY",
          Keywords: "map",
        },
        {
          FieldName: "MapRemotePlayerVisibility",
          Type: "Choice",
          Default: 1,
          Keywords: "map,remote,player,visibility,MapRemotePlayerVisibility",
          Choices: [
            {
              Name: "Hidden",
              Value: 1,
            },
            {
              Name: "Friends",
              Value: 2,
            },
            {
              Name: "Everyone",
              Value: 3,
            },
          ],
        },
        {
          FieldName: "MaxPlayers",
          Type: "Integer",
          Default: 32,
          Keywords: "players,maximum",
          Range: {
            Min: 1,
            Max: 100,
          },
        },
        {
          FieldName: "Mods",
          Type: "String",
          Keywords: "mods",
        },
        {
          FieldName: "Open",
          Type: "Boolean",
          Default: true,
          Keywords: "whitelist,open",
        },
        {
          FieldName: "PauseEmpty",
          Type: "Boolean",
          Default: true,
          Keywords: "pause,empty,PauseEmpty",
        },
        {
          FieldName: "PerkLogs",
          Type: "Boolean",
          Default: true,
          Keywords: "perk,logs,PerkLogs",
        },
        {
          FieldName: "Public",
          Type: "Boolean",
          Default: false,
          Keywords: "public,steam",
        },
        {
          FieldName: "PublicDescription",
          Type: "Text",
          Keywords: "public,description,PublicDescription",
        },
        {
          FieldName: "PublicName",
          Type: "String",
          Keywords: "public,name,PublicName",
        },
        {
          FieldName: "SaveWorldEveryMinutes",
          Type: "Integer",
          Default: 0,
          Keywords: "save,interval,SaveWorldEveryMinutes",
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "SpawnItems",
          Type: "SpawnItems",
          Keywords: "spawn,items,SpawnItems",
        },
        {
          FieldName: "SpawnPoint",
          Type: "String",
          Default: "0,0,0",
          Keywords: "spawnpoint,map",
          DisabledValue: "0,0,0",
        },
        {
          FieldName: "UDPPort",
          Type: "Integer",
          Default: 16262,
          Keywords: "port",
          Range: {
            Min: 0,
            Max: 65535,
          },
        },
        {
          FieldName: "UPnP",
          Type: "Boolean",
          Default: false,
          Keywords: "upnp",
        },
        {
          FieldName: "WorkshopItems",
          Type: "String",
          Keywords: "workshop,items,WorkshopItems",
        },
        {
          FieldName: "ServerWelcomeMessage",
          Type: "ServerWelcomeMessage",
          Default:
            "Welcome to Project Zomboid Multiplayer! <LINE> <LINE> To interact with the Chat panel: press Tab, T, or Enter. <LINE> <LINE> The Tab key will change the target stream of the message. <LINE> <LINE> Global Streams: /all <LINE> Local Streams: /say, /yell <LINE> Special Steams: /whisper, /safehouse, /faction. <LINE> <LINE> Press the Up arrow to cycle through your message history. Click the Gear icon to customize chat. <LINE> <LINE> Happy surviving!",
          Keywords: "welcome,message,motd,ServerWelcomeMessage",
        },
      ],
    },
    {
      name: "Gameplay & Mechanics",
      options: [
        {
          FieldName: "AllowDestructionBySledgehammer",
          Type: "Boolean",
          Default: true,
          Keywords: "sledgehammer,destruction,AllowDestructionBySledgehammer",
        },
        {
          FieldName: "BloodSplatLifespanDays",
          Type: "Integer",
          Default: 0,
          Keywords: "blood,splats,days,lifespan,BloodSplatLifespanDays",
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 365,
          },
        },
        {
          FieldName: "CarEngineAttractionModifier",
          Type: "Double",
          Default: 0.5,
          Keywords: "car,engine,attraction,modifier,CarEngineAttractionModifier",
          Range: {
            Min: 0,
            Max: 10,
          },
        },
        {
          FieldName: "ConstructionPreventsLootRespawn",
          Type: "Boolean",
          Default: true,
          Keywords: "loot,respawn,construction,ConstructionPreventsLootRespawn",
        },
        {
          FieldName: "FastForwardMultiplier",
          Type: "Double",
          Default: 40,
          Keywords: "fast,forward,time,sleep,multiplier,FastForwardMultiplier",
          Range: {
            Min: 1,
            Max: 100,
          },
        },
        {
          FieldName: "HidePlayersBehindYou",
          Type: "Boolean",
          Default: true,
          Keywords: "hide,players,HidePlayersBehindYou",
        },
        {
          FieldName: "HoursForLootRespawn",
          Type: "Integer",
          Default: 0,
          Keywords: "loot,respawn,HoursForLootRespawn",
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "ItemNumbersLimitPerContainer",
          Type: "Integer",
          Default: 0,
          Keywords: "item,limit,container,ItemNumbersLimitPerContainer",
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 9000,
          },
        },
        {
          FieldName: "KnockedDownAllowed",
          Type: "Boolean",
          Default: true,
          Keywords: "knocked,down,KnockedDownAllowed",
        },
        {
          FieldName: "MaxItemsForLootRespawn",
          Type: "Integer",
          Default: 4,
          Keywords: "loot,respawn,maximum,MaxItemsForLootRespawn",
          Range: {
            Min: 1,
            Max: 2147483647,
          },
        },
        {
          FieldName: "MinutesPerPage",
          Type: "Double",
          Default: 1,
          Keywords: "minutes,book,page,MinutesPerPage",
          Range: {
            Min: 0,
            Max: 60,
          },
        },
        {
          FieldName: "NoFire",
          Type: "Boolean",
          Default: false,
          Keywords: "fire,NoFire",
        },
        {
          FieldName: "PlayerBumpPlayer",
          Type: "Boolean",
          Default: false,
          Keywords: "player,bump,PlayerBumpPlayer",
        },
        {
          FieldName: "PlayerRespawnWithOther",
          Type: "Boolean",
          Default: false,
          Keywords: "respawn,split,screen,remote,play,location,PlayerRespawnWithOther",
        },
        {
          FieldName: "PlayerRespawnWithSelf",
          Type: "Boolean",
          Default: false,
          Keywords: "respawn,death,PlayerRespawnWithSelf",
        },
        {
          FieldName: "RemovePlayerCorpsesOnCorpseRemoval",
          Type: "Boolean",
          Default: false,
          Keywords: "player,corpses,corpse,removal,RemovePlayerCorpsesOnCorpseRemoval",
        },
        {
          FieldName: "SledgehammerOnlyInSafehouse",
          Type: "Boolean",
          Default: false,
          Keywords: "sledgehammer,destruction,SledgehammerOnlyInSafehouse",
          Requirements: {
            FieldName: "AllowDestructionBySledgehammer",
            FieldValue: true,
          },
        },
        {
          FieldName: "SleepAllowed",
          Type: "Boolean",
          Default: false,
          Keywords: "sleep,SleepAllowed",
        },
        {
          FieldName: "SleepNeeded",
          Type: "Boolean",
          Default: false,
          Keywords: "sleep,SleepNeeded",
          Requirements: {
            FieldName: "SleepAllowed",
            FieldValue: true,
          },
        },
        {
          FieldName: "SneakModeHideFromOtherPlayers",
          Type: "Boolean",
          Default: true,
          Keywords: "sneak,mode,hide,hidden,SneakModeHideFromOtherPlayers",
        },
        {
          FieldName: "SpeedLimit",
          Type: "Double",
          Default: 70,
          Keywords: "speed,limit,SpeedLimit",
          Range: {
            Min: 10,
            Max: 150,
          },
        },
        {
          FieldName: "TrashDeleteAll",
          Type: "Boolean",
          Default: false,
          Keywords: "trash,delete,all,TrashDeleteAll",
        },
      ],
    },
    {
      name: "Player",
      options: [
        {
          FieldName: "AutoCreateUserInWhiteList",
          Type: "Boolean",
          Default: false,
          Keywords: "whitelist,add,automatic,AutoCreateUserInWhiteList",
          Requirements: {
            FieldName: "Open",
            FieldValue: true,
          },
        },
        {
          FieldName: "DisplayUserName",
          Type: "Boolean",
          Default: true,
          Keywords: "display,name,DisplayUserName",
        },
        {
          FieldName: "DropOffWhiteListAfterDeath",
          Type: "Boolean",
          Default: false,
          Keywords: "whitelist,drop,death,DropOffWhiteListAfterDeath",
        },
        {
          FieldName: "LoginQueueConnectTimeout",
          Type: "Integer",
          Default: 60,
          Keywords: "login,queue,LoginQueueConnectTimeout",
          Requirements: {
            FieldName: "LoginQueueEnabled",
            FieldValue: true,
          },
          Range: {
            Min: 20,
            Max: 1200,
          },
        },
        {
          FieldName: "LoginQueueEnabled",
          Type: "Boolean",
          Default: false,
          Keywords: "login,queue,LoginQueueEnabled",
        },
        {
          FieldName: "MaxAccountsPerUser",
          Type: "Integer",
          Default: 0,
          Keywords: "maximum,accounts,MaxAccountsPerUser",
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "MouseOverToSeeDisplayName",
          Type: "Boolean",
          Default: true,
          Keywords: "mouse,over,display,name,MouseOverToSeeDisplayName",
        },
        {
          FieldName: "PingLimit",
          Type: "Integer",
          Default: 400,
          Keywords: "ping,limit,PingLimit",
          DisabledValue: 100,
          Range: {
            Min: 100,
            Max: 2147483647,
          },
        },
        {
          FieldName: "ShowFirstAndLastName",
          Type: "Boolean",
          Default: false,
          Keywords: "display,character,name,ShowFirstAndLastName",
        },
        {
          FieldName: "SteamScoreboard",
          Type: "Boolean",
          Default: true,
          Keywords: "steam,scoreboard,SteamScoreboard",
        },
      ],
    },
    {
      name: "PVP",
      options: [
        {
          FieldName: "PVP",
          Type: "Boolean",
          Default: true,
          Keywords: "pvp",
        },
        {
          FieldName: "PVPFirearmDamageModifier",
          Type: "Double",
          Default: 50,
          Keywords: "pvp,firearm,damage,modifier,PVPFirearmDamageModifier",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
          Range: {
            Min: 0,
            Max: 500,
          },
        },
        {
          FieldName: "PVPMeleeDamageModifier",
          Type: "Double",
          Default: 30,
          Keywords: "pvp,melee,damage,modifier,PVPMeleeDamageModifier",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
          Range: {
            Min: 0,
            Max: 500,
          },
        },
        {
          FieldName: "PVPMeleeWhileHitReaction",
          Type: "Boolean",
          Default: false,
          Keywords: "pvp,melee,hit,reaction,PVPMeleeWhileHitReaction",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
        },
        {
          FieldName: "SafetyCooldownTimer",
          Type: "Integer",
          Default: 3,
          Keywords: "safety,system,pvp,timer,cooldown,SafetyCooldownTimer",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
          Range: {
            Min: 0,
            Max: 1000,
          },
        },
        {
          FieldName: "SafetySystem",
          Type: "Boolean",
          Default: true,
          Keywords: "safety,system,pvp,SafetySystem",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
        },
        {
          FieldName: "SafetyToggleTimer",
          Type: "Integer",
          Default: 2,
          Keywords: "safety,system,pvp,timer,SafetyToggleTimer",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
          Range: {
            Min: 0,
            Max: 1000,
          },
        },
        {
          FieldName: "ShowSafety",
          Type: "Boolean",
          Default: true,
          Keywords: "pvp,status,safety,system,ShowSafety",
          Requirements: {
            FieldName: "PVP",
            FieldValue: true,
          },
        },
      ],
    },
    {
      name: "Safehouse",
      options: [
        {
          FieldName: "AdminSafehouse",
          Type: "Boolean",
          Default: false,
          Keywords: "safehouse,AdminSafehouse",
        },
        {
          FieldName: "DisableSafehouseWhenPlayerConnected",
          Type: "Boolean",
          Default: false,
          Keywords: "safehouse,disable,connected,DisableSafehouseWhenPlayerConnected",
        },
        {
          FieldName: "PlayerSafehouse",
          Type: "Boolean",
          Default: false,
          Keywords: "safehouse,PlayerSafehouse",
        },
        {
          FieldName: "SafeHouseRemovalTime",
          Type: "Integer",
          Default: 144,
          Keywords: "safehouse,house,removal,SafeHouseRemovalTime",
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "SafehouseAllowFire",
          Type: "Boolean",
          Default: true,
          Keywords: "safehouse,fire,SafehouseAllowFire",
        },
        {
          FieldName: "SafehouseAllowLoot",
          Type: "Boolean",
          Default: true,
          Keywords: "safehouse,loot,SafehouseAllowLoot",
        },
        {
          FieldName: "SafehouseAllowNonResidential",
          Type: "Boolean",
          Default: false,
          Keywords: "safehouse,non-residential,SafehouseAllowNonResidential",
        },
        {
          FieldName: "SafehouseAllowRespawn",
          Type: "Boolean",
          Default: false,
          Keywords: "safehouse,respawn,SafehouseAllowRespawn",
        },
        {
          FieldName: "SafehouseAllowTrepass",
          Type: "Boolean",
          Default: true,
          Keywords: "safehouse,trespass",
        },
        {
          FieldName: "SafehouseDaySurvivedToClaim",
          Type: "Integer",
          Default: 0,
          Keywords: "safehouse,days,SafehouseDaySurvivedToClaim",
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
      ],
    },
    {
      name: "Faction",
      options: [
        {
          FieldName: "Faction",
          Type: "Boolean",
          Default: true,
          Keywords: "factions",
        },
        {
          FieldName: "FactionDaySurvivedToCreate",
          Type: "Integer",
          Default: 0,
          Keywords: "factions,FactionDaySurvivedToCreate",
          Requirements: {
            FieldName: "Faction",
            FieldValue: true,
          },
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "FactionPlayersRequiredForTag",
          Type: "Integer",
          Default: 1,
          Keywords: "faction,tag,FactionPlayersRequiredForTag",
          Requirements: {
            FieldName: "Faction",
            FieldValue: true,
          },
          Range: {
            Min: 1,
            Max: 2147483647,
          },
        },
      ],
    },
    {
      name: "VOIP & Chat",
      options: [
        {
          FieldName: "ChatStreams",
          Type: "String",
          Default: "s,r,a,w,y,sh,f,all",
          Keywords: "chat,streams,ChatStreams",
        },
        {
          FieldName: "DisableRadioAdmin",
          Type: "Boolean",
          Default: true,
          Keywords: "radio,admin,DisableRadioAdmin",
        },
        {
          FieldName: "DisableRadioGM",
          Type: "Boolean",
          Default: true,
          Keywords: "radio,gm,DisableRadioGM",
        },
        {
          FieldName: "DisableRadioInvisible",
          Type: "Boolean",
          Default: true,
          Keywords: "radio,invisible,DisableRadioInvisible",
        },
        {
          FieldName: "DisableRadioModerator",
          Type: "Boolean",
          Default: false,
          Keywords: "radio,moderator,DisableRadioModerator",
        },
        {
          FieldName: "DisableRadioOverseer",
          Type: "Boolean",
          Default: false,
          Keywords: "radio,overseer,DisableRadioOverseer",
        },
        {
          FieldName: "DisableRadioStaff",
          Type: "Boolean",
          Default: false,
          Keywords: "radio,staff,DisableRadioStaff",
        },
        {
          FieldName: "GlobalChat",
          Type: "Boolean",
          Default: true,
          Keywords: "chat,global,GlobalChat",
        },
        {
          FieldName: "Voice3D",
          Type: "Boolean",
          Default: true,
          Keywords: "voice,3D,Voice3D",
          Requirements: {
            FieldName: "VoiceEnable",
            FieldValue: true,
          },
        },
        {
          FieldName: "VoiceEnable",
          Type: "Boolean",
          Default: true,
          Keywords: "voice,enable,VoiceEnable",
        },
        {
          FieldName: "VoiceMaxDistance",
          Type: "Double",
          Default: 100,
          Keywords: "voice,maximum,max,distance,VoiceMaxDistance",
          Requirements: {
            FieldName: "VoiceEnable",
            FieldValue: true,
          },
          Range: {
            Min: 100,
            Max: 100000,
          },
        },
        {
          FieldName: "VoiceMinDistance",
          Type: "Double",
          Default: 10,
          Keywords: "voice,minimum,min,distance,VoiceMinDistance",
          Requirements: {
            FieldName: "VoiceEnable",
            FieldValue: true,
          },
          Range: {
            Min: 10,
            Max: 100000,
          },
        },
      ],
    },
    {
      name: "Discord",
      options: [
        {
          FieldName: "DiscordEnable",
          Type: "Boolean",
          Default: false,
          Keywords: "discord,DiscordEnable",
          DisabledValue: "",
        },
        {
          FieldName: "DiscordToken",
          Type: "String",
          Keywords: "discord,token,DiscordToken",
          Requirements: {
            FieldName: "DiscordEnable",
            FieldValue: true,
          },
        },
        {
          FieldName: "DiscordChannel",
          Type: "String",
          Keywords: "discord,channel,DiscordChannel",
          Requirements: {
            FieldName: "DiscordEnable",
            FieldValue: true,
          },
        },
        {
          FieldName: "DiscordChannelID",
          Type: "String",
          Keywords: "discord,channel,id,DiscordChannelID",
          Requirements: {
            FieldName: "DiscordEnable",
            FieldValue: true,
          },
        },
      ],
    },
    {
      name: "Backup",
      options: [
        {
          FieldName: "BackupsCount",
          Type: "Integer",
          Default: 5,
          Keywords: "backups,count,BackupsCount",
          Range: {
            Min: 1,
            Max: 300,
          },
        },
        {
          FieldName: "BackupsOnStart",
          Type: "Boolean",
          Default: true,
          Keywords: "backups,start,BackupsOnStart",
        },
        {
          FieldName: "BackupsOnVersionChange",
          Type: "Boolean",
          Default: true,
          Keywords: "backups,version,change,BackupsOnVersionChange",
        },
        {
          FieldName: "BackupsPeriod",
          Type: "Integer",
          Default: 0,
          Keywords: "backups,period,BackupsPeriod",
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 1500,
          },
        },
      ],
    },
    {
      name: "Anti-Cheat",
      options: [
        {
          FieldName: "AntiCheatProtectionType1",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType2",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType3",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType4",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType5",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType6",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType7",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType8",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType9",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType10",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType11",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType12",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType13",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType14",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType15",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType16",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType17",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType18",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType19",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType20",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType21",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType22",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType23",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType24",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat",
        },
        {
          FieldName: "AntiCheatProtectionType2ThresholdMultiplier",
          Type: "Double",
          Default: 3,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType3ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType4ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType9ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType15ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType20ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType22ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType24ThresholdMultiplier",
          Type: "Double",
          Default: 6,
          Keywords: "anticheat",
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "DoLuaChecksum",
          Type: "Boolean",
          Default: true,
          Keywords: "anticheat,lua,checksum,kick,DoLuaChecksum",
        },
        {
          FieldName: "KickFastPlayers",
          Type: "Boolean",
          Default: false,
          Keywords: "kick,fast,players,KickFastPlayers",
        },
        {
          FieldName: "SteamVAC",
          Type: "Boolean",
          Default: true,
          Keywords: "VAC,cheat,anticheat,SteamVAC",
        },
      ],
    },
    {
      name: "Miscellaneous",
      options: [
        {
          FieldName: "ResetID",
          Type: "Information",
          Keywords: "reset,id,ResetID,miscellaneous",
        },
        {
          FieldName: "ServerPlayerID",
          Type: "Information",
          Keywords: "player,id,ServerPlayerID,miscellaneous",
        },
      ],
    },
  ],
};

export const optionsFlat: Option[] = options.categories.flatMap((category) => category.options);
export const optionsMap: Map<string, Option> = new Map(optionsFlat.map((option) => [option.FieldName, option]));

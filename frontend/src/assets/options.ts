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
  }[];
  Choices?: {
    Name: string;
    Value: boolean | number | string;
  }[];
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
        // Server
        {
          FieldName: "PublicName",
          Type: "String",
        },
        {
          FieldName: "PublicDescription",
          Type: "Text",
        },
        {
          FieldName: "ServerWelcomeMessage",
          Type: "ServerWelcomeMessage",
          Default:
            "Welcome to Project Zomboid Multiplayer! <LINE> <LINE> To interact with the Chat panel: press Tab, T, or Enter. <LINE> <LINE> The Tab key will change the target stream of the message. <LINE> <LINE> Global Streams: /all <LINE> Local Streams: /say, /yell <LINE> Special Steams: /whisper, /safehouse, /faction. <LINE> <LINE> Press the Up arrow to cycle through your message history. Click the Gear icon to customize chat. <LINE> <LINE> Happy surviving!",
        },
        {
          FieldName: "Open",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "Public",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "DenyLoginOnOverloadedServer",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "SaveWorldEveryMinutes",
          Type: "Integer",
          Default: 0,
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },

        // Start
        {
          FieldName: "SpawnItems",
          Type: "SpawnItems",
        },
        {
          FieldName: "SpawnPoint",
          Type: "String",
          Default: "0,0,0",
          DisabledValue: "0,0,0",
        },

        // Players
        {
          FieldName: "MaxPlayers",
          Type: "Integer",
          Default: 32,
          Range: {
            Min: 1,
            Max: 100,
          },
        },
        {
          FieldName: "PauseEmpty",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AllowCoop",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AllowNonAsciiUsername",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "AnnounceDeath",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "BanKickGlobalSound",
          Type: "Boolean",
          Default: true,
        },

        // Mods and map
        {
          FieldName: "Mods",
          Type: "String",
        },
        {
          FieldName: "WorkshopItems",
          Type: "String",
        },
        {
          FieldName: "Map",
          Type: "String",
          Default: "Muldraugh, KY",
        },

        // Network
        {
          FieldName: "DefaultPort",
          Type: "Integer",
          Default: 16261,
          Range: {
            Min: 0,
            Max: 65535,
          },
        },
        {
          FieldName: "UDPPort",
          Type: "Integer",
          Default: 16262,
          Range: {
            Min: 0,
            Max: 65535,
          },
        },
        {
          FieldName: "UPnP",
          Type: "Boolean",
          Default: false,
        },

        // Logging
        {
          FieldName: "ClientCommandFilter",
          Type: "String",
          Default: "-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart",
        },
        {
          FieldName: "ClientActionLogs",
          Type: "String",
          Default: "ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;",
        },
        {
          FieldName: "PerkLogs",
          Type: "Boolean",
          Default: true,
        },
      ],
    },
    {
      name: "Gameplay & Mechanics",
      options: [
        // Modifiers and limits
        {
          FieldName: "MinutesPerPage",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 0,
            Max: 60,
          },
        },
        {
          FieldName: "CarEngineAttractionModifier",
          Type: "Double",
          Default: 0.5,
          Range: {
            Min: 0,
            Max: 10,
          },
        },
        {
          FieldName: "SpeedLimit",
          Type: "Double",
          Default: 70,
          Range: {
            Min: 10,
            Max: 150,
          },
        },
        {
          FieldName: "ItemNumbersLimitPerContainer",
          Type: "Integer",
          Default: 0,
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 9000,
          },
        },

        // Sledgehammer
        {
          FieldName: "AllowDestructionBySledgehammer",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "SledgehammerOnlyInSafehouse",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "AllowDestructionBySledgehammer",
              FieldValue: true,
            },
          ],
        },

        // Loot
        {
          FieldName: "ConstructionPreventsLootRespawn",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "HoursForLootRespawn",
          Type: "Integer",
          Default: 0,
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "MaxItemsForLootRespawn",
          Type: "Integer",
          Default: 4,
          Range: {
            Min: 1,
            Max: 2147483647,
          },
        },

        // Environment
        {
          FieldName: "NoFire",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "BloodSplatLifespanDays",
          Type: "Integer",
          Default: 0,
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 365,
          },
        },

        // Player
        {
          FieldName: "SleepAllowed",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "SleepNeeded",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "SleepAllowed",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "FastForwardMultiplier",
          Type: "Double",
          Default: 40,
          Range: {
            Min: 1,
            Max: 100,
          },
          Requirements: [
            {
              FieldName: "SleepAllowed",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "MapRemotePlayerVisibility",
          Type: "Choice",
          Default: 1,
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
          FieldName: "HidePlayersBehindYou",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "PlayerBumpPlayer",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "KnockedDownAllowed",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "SneakModeHideFromOtherPlayers",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "PlayerRespawnWithOther",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "AllowCoop",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "PlayerRespawnWithSelf",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "RemovePlayerCorpsesOnCorpseRemoval",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "TrashDeleteAll",
          Type: "Boolean",
          Default: false,
        },
      ],
    },
    {
      name: "Safehouse",
      options: [
        // Basic
        {
          FieldName: "PlayerSafehouse",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "AdminSafehouse",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "PlayerSafehouse",
              FieldValue: false,
            },
          ],
        },
        {
          FieldName: "SafehouseDaySurvivedToClaim",
          Type: "Integer",
          Default: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "SafeHouseRemovalTime",
          Type: "Integer",
          Default: 144,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "DisableSafehouseWhenPlayerConnected",
          Type: "Boolean",
          Default: false,
        },

        {
          FieldName: "SafehouseAllowNonResidential",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "SafehouseAllowRespawn",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "SafehouseAllowFire",
          Type: "Boolean",
          Default: true,
        },

        // Non-member
        {
          FieldName: "SafehouseAllowTrepass",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "SafehouseAllowLoot",
          Type: "Boolean",
          Default: true,
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
        },
        {
          FieldName: "FactionDaySurvivedToCreate",
          Type: "Integer",
          Default: 0,
          Requirements: [
            {
              FieldName: "Faction",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "FactionPlayersRequiredForTag",
          Type: "Integer",
          Default: 1,
          Requirements: [
            {
              FieldName: "Faction",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 1,
            Max: 2147483647,
          },
        },
      ],
    },
    {
      name: "Player",
      options: [
        // Basic
        {
          FieldName: "DisplayUserName",
          Type: "Boolean",
          Default: true,
          Requirements: [
            {
              FieldName: "ShowFirstAndLastName",
              FieldValue: false,
            },
          ],
        },
        {
          FieldName: "ShowFirstAndLastName",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "MouseOverToSeeDisplayName",
          Type: "Boolean",
          Default: true,
        },

        // Login queue
        {
          FieldName: "LoginQueueEnabled",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "LoginQueueConnectTimeout",
          Type: "Integer",
          Default: 60,
          Requirements: [
            {
              FieldName: "LoginQueueEnabled",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 20,
            Max: 1200,
          },
        },

        // Whitelist
        {
          FieldName: "AutoCreateUserInWhiteList",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "Open",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "DropOffWhiteListAfterDeath",
          Type: "Boolean",
          Default: false,
        },

        // Limits
        {
          FieldName: "MaxAccountsPerUser",
          Type: "Integer",
          Default: 0,
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 2147483647,
          },
        },
        {
          FieldName: "PingLimit",
          Type: "Integer",
          Default: 400,
          DisabledValue: 100,
          Range: {
            Min: 100,
            Max: 2147483647,
          },
        },

        // Misc
        {
          FieldName: "SteamScoreboard",
          Type: "Boolean",
          Default: true,
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
        },

        // Safety System
        {
          FieldName: "SafetySystem",
          Type: "Boolean",
          Default: true,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "ShowSafety",
          Type: "Boolean",
          Default: true,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
            {
              FieldName: "SafetySystem",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "SafetyCooldownTimer",
          Type: "Integer",
          Default: 3,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
            {
              FieldName: "SafetySystem",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 0,
            Max: 1000,
          },
        },
        {
          FieldName: "SafetyToggleTimer",
          Type: "Integer",
          Default: 2,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
            {
              FieldName: "SafetySystem",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 0,
            Max: 1000,
          },
        },

        // Other
        {
          FieldName: "PVPFirearmDamageModifier",
          Type: "Double",
          Default: 50,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 0,
            Max: 500,
          },
        },
        {
          FieldName: "PVPMeleeDamageModifier",
          Type: "Double",
          Default: 30,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 0,
            Max: 500,
          },
        },
        {
          FieldName: "PVPMeleeWhileHitReaction",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "PVP",
              FieldValue: true,
            },
          ],
        },
      ],
    },

    {
      name: "VOIP & Chat",
      options: [
        // Basic
        {
          FieldName: "GlobalChat",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "ChatStreams",
          Type: "String",
          Default: "s,r,a,w,y,sh,f,all",
        },

        // Radio
        {
          FieldName: "DisableRadioInvisible",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "DisableRadioStaff",
          Type: "Boolean",
          Default: false,
        },
        {
          FieldName: "DisableRadioAdmin",
          Type: "Boolean",
          Default: true,
          Requirements: [
            {
              FieldName: "DisableRadioStaff",
              FieldValue: false,
            },
          ],
        },
        {
          FieldName: "DisableRadioModerator",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "DisableRadioStaff",
              FieldValue: false,
            },
          ],
        },
        {
          FieldName: "DisableRadioOverseer",
          Type: "Boolean",
          Default: false,
          Requirements: [
            {
              FieldName: "DisableRadioStaff",
              FieldValue: false,
            },
          ],
        },
        {
          FieldName: "DisableRadioGM",
          Type: "Boolean",
          Default: true,
          Requirements: [
            {
              FieldName: "DisableRadioStaff",
              FieldValue: false,
            },
          ],
        },

        // VOIP
        {
          FieldName: "VoiceEnable",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "Voice3D",
          Type: "Boolean",
          Default: true,
          Requirements: [
            {
              FieldName: "VoiceEnable",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "VoiceMinDistance",
          Type: "Double",
          Default: 10,
          Requirements: [
            {
              FieldName: "VoiceEnable",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 10,
            Max: 100000,
          },
        },
        {
          FieldName: "VoiceMaxDistance",
          Type: "Double",
          Default: 100,
          Requirements: [
            {
              FieldName: "VoiceEnable",
              FieldValue: true,
            },
          ],
          Range: {
            Min: 100,
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
          DisabledValue: "",
        },
        {
          FieldName: "DiscordToken",
          Type: "String",
          Requirements: [
            {
              FieldName: "DiscordEnable",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "DiscordChannel",
          Type: "String",
          Requirements: [
            {
              FieldName: "DiscordEnable",
              FieldValue: true,
            },
          ],
        },
        {
          FieldName: "DiscordChannelID",
          Type: "String",
          Requirements: [
            {
              FieldName: "DiscordEnable",
              FieldValue: true,
            },
          ],
        },
      ],
    },
    {
      name: "Backup",
      options: [
        {
          FieldName: "BackupsOnStart",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "BackupsOnVersionChange",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "BackupsPeriod",
          Type: "Integer",
          Default: 0,
          DisabledValue: 0,
          Range: {
            Min: 0,
            Max: 1500,
          },
        },
        {
          FieldName: "BackupsCount",
          Type: "Integer",
          Default: 5,
          Range: {
            Min: 1,
            Max: 300,
          },
        },
      ],
    },
    {
      name: "Anti-Cheat",
      options: [
        {
          FieldName: "SteamVAC",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "DoLuaChecksum",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "KickFastPlayers",
          Type: "Boolean",
          Default: false,
        },

        {
          FieldName: "AntiCheatProtectionType1",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType2",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType3",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType4",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType5",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType6",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType7",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType8",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType9",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType10",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType11",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType12",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType13",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType14",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType15",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType16",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType17",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType18",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType19",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType20",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType21",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType22",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType23",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType24",
          Type: "Boolean",
          Default: true,
        },
        {
          FieldName: "AntiCheatProtectionType2ThresholdMultiplier",
          Type: "Double",
          Default: 3,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType3ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType4ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType9ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType15ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType20ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType22ThresholdMultiplier",
          Type: "Double",
          Default: 1,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
        {
          FieldName: "AntiCheatProtectionType24ThresholdMultiplier",
          Type: "Double",
          Default: 6,
          Range: {
            Min: 1,
            Max: 10,
          },
        },
      ],
    },
    {
      name: "Miscellaneous",
      options: [
        {
          FieldName: "ResetID",
          Type: "Information",
        },
        {
          FieldName: "ServerPlayerID",
          Type: "Information",
        },
      ],
    },
  ],
};

export const optionsFlat: Option[] = options.categories.flatMap((category) => category.options);
export const optionsMap: Map<string, Option> = new Map(optionsFlat.map((option) => [option.FieldName, option]));

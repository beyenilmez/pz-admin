import type { GameBuild } from "@/features/game/types";
import { MAXIMUM_RCON_COMMAND_BYTES } from "@/shared/lib/rcon";
import { utf8ByteLength } from "@/shared/lib/text";

export type ScalarOptionValue = boolean | number | string;
export type OptionValue = ScalarOptionValue | string[];

export type OptionType = "boolean" | "integer" | "number" | "string" | "text";

export interface OptionChoice {
  id: string;
  translationGroup?: "enforcement";
  value: ScalarOptionValue;
}

export interface OptionRequirement {
  equals: ScalarOptionValue;
  option: string;
}

export interface OptionSpecialValue {
  meaning: "disabled" | "forever" | "never" | "unlimited" | "useSpawnRegions";
  value: ScalarOptionValue;
}

export interface OptionDefinition {
  choices?: OptionChoice[];
  defaultValue?: OptionValue;
  dynamicDefault?: boolean;
  editor?: "items" | "message";
  maximum?: number;
  maximumBytes?: number;
  maximumLength?: number;
  minimum?: number;
  multiple?: boolean;
  name: string;
  readOnly?: boolean;
  required?: boolean;
  requirements?: OptionRequirement[];
  secret?: boolean;
  specialValue?: OptionSpecialValue;
  type: OptionType;
  writeOnly?: boolean;
}

export interface OptionCategory {
  id: string;
  sections: OptionSection[];
}

export interface OptionSection {
  id: string;
  options: OptionDefinition[];
}

type OptionMetadata = Omit<OptionDefinition, "name">;

function getChangeOptionValueByteLimit(name: string) {
  return (
    MAXIMUM_RCON_COMMAND_BYTES - utf8ByteLength(`changeoption "${name}" ""`)
  );
}

const build41Options = {
  AdminSafehouse: { type: "boolean", defaultValue: false },
  AllowCoop: { type: "boolean", defaultValue: true },
  AllowDestructionBySledgehammer: { type: "boolean", defaultValue: true },
  AllowNonAsciiUsername: { type: "boolean", defaultValue: false },
  AnnounceDeath: { type: "boolean", defaultValue: false },
  AntiCheatProtectionType1: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType10: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType11: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType12: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType13: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType14: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType15: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType15ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType15", equals: true }],
  },
  AntiCheatProtectionType16: {
    type: "boolean",
    defaultValue: true,
  },
  AntiCheatProtectionType17: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType18: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType19: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType2: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType20: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType20ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType20", equals: true }],
  },
  AntiCheatProtectionType21: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType22: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType22ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType22", equals: true }],
  },
  AntiCheatProtectionType23: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType24: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType24ThresholdMultiplier: {
    type: "number",
    defaultValue: 6,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType24", equals: true }],
  },
  AntiCheatProtectionType2ThresholdMultiplier: {
    type: "number",
    defaultValue: 3,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType2", equals: true }],
  },
  AntiCheatProtectionType3: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType3ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType3", equals: true }],
  },
  AntiCheatProtectionType4: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType4ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType4", equals: true }],
  },
  AntiCheatProtectionType5: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType6: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType7: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType8: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType9: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType9ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType9", equals: true }],
  },
  AutoCreateUserInWhiteList: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "Open", equals: true }],
  },
  BackupsCount: { type: "integer", defaultValue: 5, minimum: 1, maximum: 300 },
  BackupsOnStart: { type: "boolean", defaultValue: true },
  BackupsOnVersionChange: { type: "boolean", defaultValue: true },
  BackupsPeriod: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 1500,
    specialValue: { value: 0, meaning: "disabled" },
  },
  BanKickGlobalSound: { type: "boolean", defaultValue: true },
  BloodSplatLifespanDays: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 365,
    specialValue: { value: 0, meaning: "forever" },
  },
  CarEngineAttractionModifier: {
    type: "number",
    defaultValue: 0.5,
    minimum: 0,
    maximum: 10,
  },
  ChatStreams: {
    type: "string",
    defaultValue: ["s", "r", "a", "w", "y", "sh", "f", "all"],
    multiple: true,
    choices: [
      { id: "say", value: "s" },
      { id: "radio", value: "r" },
      { id: "admin", value: "a" },
      { id: "whisper", value: "w" },
      { id: "yell", value: "y" },
      { id: "safehouse", value: "sh" },
      { id: "faction", value: "f" },
      { id: "global", value: "all" },
    ],
  },
  ClientActionLogs: {
    type: "string",
    defaultValue: "ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;",
  },
  ClientCommandFilter: {
    type: "string",
    defaultValue:
      "-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart",
  },
  ConstructionPreventsLootRespawn: { type: "boolean", defaultValue: true },
  DefaultPort: {
    type: "integer",
    defaultValue: 16261,
    minimum: 0,
    maximum: 65535,
  },
  DenyLoginOnOverloadedServer: { type: "boolean", defaultValue: true },
  DisableRadioAdmin: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioGM: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioInvisible: { type: "boolean", defaultValue: true },
  DisableRadioModerator: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioOverseer: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioStaff: { type: "boolean", defaultValue: false },
  DisableSafehouseWhenPlayerConnected: { type: "boolean", defaultValue: false },
  DiscordEnable: { type: "boolean", defaultValue: false },
  DiscordToken: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    secret: true,
    writeOnly: true,
  },
  DiscordChannel: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    writeOnly: true,
  },
  DiscordChannelID: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    writeOnly: true,
  },
  DisplayUserName: { type: "boolean", defaultValue: true },
  DoLuaChecksum: { type: "boolean", defaultValue: true },
  DropOffWhiteListAfterDeath: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "Open", equals: false }],
  },
  Faction: { type: "boolean", defaultValue: true },
  FactionDaySurvivedToCreate: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    requirements: [{ option: "Faction", equals: true }],
  },
  FactionPlayersRequiredForTag: {
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 2147483647,
    requirements: [{ option: "Faction", equals: true }],
  },
  FastForwardMultiplier: {
    type: "number",
    defaultValue: 40,
    minimum: 1,
    maximum: 100,
    requirements: [{ option: "SleepAllowed", equals: true }],
  },
  GlobalChat: { type: "boolean", defaultValue: true },
  HidePlayersBehindYou: { type: "boolean", defaultValue: true },
  HoursForLootRespawn: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "never" },
  },
  ItemNumbersLimitPerContainer: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 9000,
    specialValue: { value: 0, meaning: "unlimited" },
  },
  KickFastPlayers: { type: "boolean", defaultValue: false },
  KnockedDownAllowed: { type: "boolean", defaultValue: true },
  LoginQueueConnectTimeout: {
    type: "integer",
    defaultValue: 60,
    minimum: 20,
    maximum: 1200,
    requirements: [{ option: "LoginQueueEnabled", equals: true }],
  },
  LoginQueueEnabled: { type: "boolean", defaultValue: false },
  Map: { type: "string", defaultValue: "Muldraugh, KY" },
  MapRemotePlayerVisibility: {
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 3,
    choices: [
      { id: "hidden", value: 1 },
      { id: "factionAndSafehouseMembers", value: 2 },
      { id: "everyone", value: 3 },
    ],
  },
  MaxAccountsPerUser: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    requirements: [{ option: "Open", equals: true }],
    specialValue: { value: 0, meaning: "unlimited" },
  },
  MaxItemsForLootRespawn: {
    type: "integer",
    defaultValue: 4,
    minimum: 1,
    maximum: 2147483647,
  },
  MaxPlayers: { type: "integer", defaultValue: 32, minimum: 1, maximum: 100 },
  MinutesPerPage: { type: "number", defaultValue: 1, minimum: 0, maximum: 60 },
  Mods: { type: "string", defaultValue: "" },
  MouseOverToSeeDisplayName: { type: "boolean", defaultValue: true },
  NoFire: { type: "boolean", defaultValue: false },
  Open: { type: "boolean", defaultValue: true },
  PVP: { type: "boolean", defaultValue: true },
  PVPFirearmDamageModifier: {
    type: "number",
    defaultValue: 50,
    minimum: 0,
    maximum: 500,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPMeleeDamageModifier: {
    type: "number",
    defaultValue: 30,
    minimum: 0,
    maximum: 500,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPMeleeWhileHitReaction: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "PVP", equals: true }],
  },
  PauseEmpty: { type: "boolean", defaultValue: true },
  PerkLogs: { type: "boolean", defaultValue: true },
  PingLimit: {
    type: "integer",
    defaultValue: 400,
    minimum: 100,
    maximum: 2147483647,
    specialValue: { value: 100, meaning: "disabled" },
  },
  PlayerBumpPlayer: { type: "boolean", defaultValue: false },
  PlayerRespawnWithOther: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "AllowCoop", equals: true }],
  },
  PlayerRespawnWithSelf: { type: "boolean", defaultValue: false },
  PlayerSafehouse: { type: "boolean", defaultValue: false },
  Public: { type: "boolean", defaultValue: false },
  PublicDescription: { type: "text", defaultValue: "", maximumLength: 256 },
  PublicName: {
    type: "string",
    defaultValue: "My PZ Server",
    maximumLength: 64,
  },
  RemovePlayerCorpsesOnCorpseRemoval: { type: "boolean", defaultValue: false },
  ResetID: {
    type: "integer",
    minimum: 0,
    maximum: 2147483647,
    readOnly: true,
    dynamicDefault: true,
  },
  SafeHouseRemovalTime: {
    type: "integer",
    defaultValue: 144,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "never" },
  },
  SafehouseAllowFire: { type: "boolean", defaultValue: true },
  SafehouseAllowLoot: { type: "boolean", defaultValue: true },
  SafehouseAllowNonResidential: { type: "boolean", defaultValue: false },
  SafehouseAllowRespawn: { type: "boolean", defaultValue: false },
  SafehouseAllowTrepass: { type: "boolean", defaultValue: true },
  SafehouseDaySurvivedToClaim: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
  },
  SafetyCooldownTimer: {
    type: "integer",
    defaultValue: 3,
    minimum: 0,
    maximum: 1000,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SafetySystem: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "PVP", equals: true }],
  },
  SafetyToggleTimer: {
    type: "integer",
    defaultValue: 2,
    minimum: 0,
    maximum: 1000,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SaveWorldEveryMinutes: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "disabled" },
  },
  ServerPlayerID: { type: "string", readOnly: true, dynamicDefault: true },
  ServerWelcomeMessage: {
    type: "string",
    defaultValue:
      "Welcome to Project Zomboid Multiplayer! <LINE> <LINE> To interact with the Chat panel: press Tab, T, or Enter. <LINE> <LINE> The Tab key will change the target stream of the message. <LINE> <LINE> Global Streams: /all <LINE> Local Streams: /say, /yell <LINE> Special Steams: /whisper, /safehouse, /faction. <LINE> <LINE> Press the Up arrow to cycle through your message history. Click the Gear icon to customize chat. <LINE> <LINE> Happy surviving!",
    editor: "message",
    maximumBytes: getChangeOptionValueByteLimit("ServerWelcomeMessage"),
  },
  ShowFirstAndLastName: { type: "boolean", defaultValue: false },
  ShowSafety: {
    type: "boolean",
    defaultValue: true,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SledgehammerOnlyInSafehouse: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "AllowDestructionBySledgehammer", equals: true }],
  },
  SleepAllowed: { type: "boolean", defaultValue: false },
  SleepNeeded: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "SleepAllowed", equals: true }],
  },
  SneakModeHideFromOtherPlayers: { type: "boolean", defaultValue: true },
  SpawnItems: {
    type: "string",
    defaultValue: "",
    editor: "items",
    maximumBytes: getChangeOptionValueByteLimit("SpawnItems"),
  },
  SpawnPoint: {
    type: "string",
    defaultValue: "0,0,0",
    required: true,
    specialValue: { value: "0,0,0", meaning: "useSpawnRegions" },
  },
  SpeedLimit: { type: "number", defaultValue: 70, minimum: 10, maximum: 150 },
  SteamScoreboard: {
    type: "string",
    defaultValue: "true",
    choices: [
      { id: "everyone", value: "true" },
      { id: "administrators", value: "admin" },
      { id: "nobody", value: "false" },
    ],
  },
  SteamVAC: { type: "boolean", defaultValue: true },
  TrashDeleteAll: { type: "boolean", defaultValue: false },
  UDPPort: { type: "integer", defaultValue: 16262, minimum: 0, maximum: 65535 },
  UPnP: { type: "boolean", defaultValue: true },
  Voice3D: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  VoiceEnable: { type: "boolean", defaultValue: true },
  VoiceMaxDistance: {
    type: "number",
    defaultValue: 100,
    minimum: 0,
    maximum: 100000,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  VoiceMinDistance: {
    type: "number",
    defaultValue: 10,
    minimum: 0,
    maximum: 100000,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  WorkshopItems: { type: "string", defaultValue: "" },
  server_browser_announced_ip: { type: "string", defaultValue: "" },
} satisfies Record<string, OptionMetadata>;

const antiCheatPolicyChoices: OptionChoice[] = [
  { id: "ban", translationGroup: "enforcement", value: 1 },
  { id: "kick", translationGroup: "enforcement", value: 2 },
  { id: "log", translationGroup: "enforcement", value: 3 },
  { id: "disabled", translationGroup: "enforcement", value: 4 },
];

export const build42Options = {
  // Options unchanged from Build 41
  AdminSafehouse: { type: "boolean", defaultValue: false },
  AllowCoop: { type: "boolean", defaultValue: true },
  AllowDestructionBySledgehammer: { type: "boolean", defaultValue: true },
  AllowNonAsciiUsername: { type: "boolean", defaultValue: false },
  AnnounceDeath: { type: "boolean", defaultValue: false },
  BackupsCount: { type: "integer", defaultValue: 5, minimum: 1, maximum: 300 },
  BackupsOnStart: { type: "boolean", defaultValue: true },
  BackupsOnVersionChange: { type: "boolean", defaultValue: true },
  BackupsPeriod: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 1500,
    specialValue: { value: 0, meaning: "disabled" },
  },
  BanKickGlobalSound: { type: "boolean", defaultValue: true },
  BloodSplatLifespanDays: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 365,
    specialValue: { value: 0, meaning: "forever" },
  },
  CarEngineAttractionModifier: {
    type: "number",
    defaultValue: 0.5,
    minimum: 0,
    maximum: 10,
  },
  ChatStreams: {
    type: "string",
    defaultValue: ["s", "r", "a", "w", "y", "sh", "f", "all"],
    multiple: true,
    choices: [
      { id: "say", value: "s" },
      { id: "radio", value: "r" },
      { id: "admin", value: "a" },
      { id: "whisper", value: "w" },
      { id: "yell", value: "y" },
      { id: "safehouse", value: "sh" },
      { id: "faction", value: "f" },
      { id: "global", value: "all" },
    ],
  },
  ClientActionLogs: {
    type: "string",
    defaultValue: "ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;",
  },
  ClientCommandFilter: {
    type: "string",
    defaultValue:
      "-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart",
  },
  DefaultPort: {
    type: "integer",
    defaultValue: 16261,
    minimum: 0,
    maximum: 65535,
  },
  DenyLoginOnOverloadedServer: { type: "boolean", defaultValue: true },
  DisableRadioAdmin: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioGM: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioInvisible: { type: "boolean", defaultValue: true },
  DisableRadioModerator: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioOverseer: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioStaff: { type: "boolean", defaultValue: false },
  DiscordEnable: { type: "boolean", defaultValue: false },
  DiscordToken: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    secret: true,
    writeOnly: true,
  },
  DisplayUserName: { type: "boolean", defaultValue: true },
  DoLuaChecksum: { type: "boolean", defaultValue: true },
  Faction: { type: "boolean", defaultValue: true },
  FactionDaySurvivedToCreate: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    requirements: [{ option: "Faction", equals: true }],
  },
  FactionPlayersRequiredForTag: {
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 2147483647,
    requirements: [{ option: "Faction", equals: true }],
  },
  FastForwardMultiplier: {
    type: "number",
    defaultValue: 40,
    minimum: 1,
    maximum: 100,
    requirements: [{ option: "SleepAllowed", equals: true }],
  },
  GlobalChat: { type: "boolean", defaultValue: true },
  HidePlayersBehindYou: { type: "boolean", defaultValue: true },
  ItemNumbersLimitPerContainer: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 9000,
    specialValue: { value: 0, meaning: "unlimited" },
  },
  LoginQueueConnectTimeout: {
    type: "integer",
    defaultValue: 60,
    minimum: 20,
    maximum: 1200,
    requirements: [{ option: "LoginQueueEnabled", equals: true }],
  },
  LoginQueueEnabled: { type: "boolean", defaultValue: false },
  Map: { type: "string", defaultValue: "Muldraugh, KY" },
  Mods: { type: "string", defaultValue: "" },
  MouseOverToSeeDisplayName: { type: "boolean", defaultValue: true },
  NoFire: { type: "boolean", defaultValue: false },
  Open: { type: "boolean", defaultValue: true },
  PVP: { type: "boolean", defaultValue: true },
  PVPFirearmDamageModifier: {
    type: "number",
    defaultValue: 50,
    minimum: 0,
    maximum: 500,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPMeleeDamageModifier: {
    type: "number",
    defaultValue: 30,
    minimum: 0,
    maximum: 500,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPMeleeWhileHitReaction: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "PVP", equals: true }],
  },
  PauseEmpty: { type: "boolean", defaultValue: true },
  PerkLogs: { type: "boolean", defaultValue: true },
  PlayerBumpPlayer: { type: "boolean", defaultValue: false },
  PlayerRespawnWithOther: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "AllowCoop", equals: true }],
  },
  PlayerRespawnWithSelf: { type: "boolean", defaultValue: false },
  PlayerSafehouse: { type: "boolean", defaultValue: false },
  Public: { type: "boolean", defaultValue: false },
  PublicDescription: { type: "text", defaultValue: "", maximumLength: 256 },
  PublicName: {
    type: "string",
    defaultValue: "My PZ Server",
    maximumLength: 64,
  },
  RemovePlayerCorpsesOnCorpseRemoval: { type: "boolean", defaultValue: false },
  ResetID: {
    type: "integer",
    minimum: 0,
    maximum: 2147483647,
    readOnly: true,
    dynamicDefault: true,
  },
  SafeHouseRemovalTime: {
    type: "integer",
    defaultValue: 144,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "never" },
  },
  SafehouseAllowFire: { type: "boolean", defaultValue: true },
  SafehouseAllowLoot: { type: "boolean", defaultValue: true },
  SafehouseAllowNonResidential: { type: "boolean", defaultValue: false },
  SafehouseAllowRespawn: { type: "boolean", defaultValue: false },
  SafehouseAllowTrepass: { type: "boolean", defaultValue: true },
  SafehouseDaySurvivedToClaim: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
  },
  SafetyCooldownTimer: {
    type: "integer",
    defaultValue: 3,
    minimum: 0,
    maximum: 1000,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SafetySystem: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "PVP", equals: true }],
  },
  SafetyToggleTimer: {
    type: "integer",
    defaultValue: 2,
    minimum: 0,
    maximum: 1000,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SaveWorldEveryMinutes: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "disabled" },
  },
  ServerPlayerID: { type: "string", readOnly: true, dynamicDefault: true },
  ServerWelcomeMessage: {
    type: "string",
    defaultValue:
      "Welcome to Project Zomboid Multiplayer! <LINE> <LINE> To interact with the Chat panel: press Tab, T, or Enter. <LINE> <LINE> The Tab key will change the target stream of the message. <LINE> <LINE> Global Streams: /all <LINE> Local Streams: /say, /yell <LINE> Special Steams: /whisper, /safehouse, /faction. <LINE> <LINE> Press the Up arrow to cycle through your message history. Click the Gear icon to customize chat. <LINE> <LINE> Happy surviving!",
    editor: "message",
    maximumBytes: getChangeOptionValueByteLimit("ServerWelcomeMessage"),
  },
  ShowFirstAndLastName: { type: "boolean", defaultValue: false },
  ShowSafety: {
    type: "boolean",
    defaultValue: true,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SledgehammerOnlyInSafehouse: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "AllowDestructionBySledgehammer", equals: true }],
  },
  SleepAllowed: { type: "boolean", defaultValue: false },
  SleepNeeded: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "SleepAllowed", equals: true }],
  },
  SneakModeHideFromOtherPlayers: { type: "boolean", defaultValue: true },
  SpawnItems: {
    type: "string",
    defaultValue: "",
    editor: "items",
    maximumBytes: getChangeOptionValueByteLimit("SpawnItems"),
  },
  SpawnPoint: {
    type: "string",
    defaultValue: "0,0,0",
    required: true,
    specialValue: { value: "0,0,0", meaning: "useSpawnRegions" },
  },
  SpeedLimit: { type: "number", defaultValue: 70, minimum: 10, maximum: 150 },
  SteamVAC: { type: "boolean", defaultValue: true },
  TrashDeleteAll: { type: "boolean", defaultValue: false },
  UDPPort: { type: "integer", defaultValue: 16262, minimum: 0, maximum: 65535 },
  UPnP: { type: "boolean", defaultValue: true },
  Voice3D: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  VoiceEnable: { type: "boolean", defaultValue: true },
  VoiceMaxDistance: {
    type: "number",
    defaultValue: 100,
    minimum: 0,
    maximum: 100000,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  VoiceMinDistance: {
    type: "number",
    defaultValue: 10,
    minimum: 0,
    maximum: 100000,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  WorkshopItems: { type: "string", defaultValue: "" },
  server_browser_announced_ip: { type: "string", defaultValue: "" },

  // Options changed from Build 41
  DropOffWhiteListAfterDeath: {
    type: "boolean",
    defaultValue: false,
  },
  KnockedDownAllowed: { type: "boolean", defaultValue: false },
  MapRemotePlayerVisibility: {
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 4,
    choices: [
      { id: "hidden", value: 1 },
      { id: "factionAndSafehouseMembers", value: 2 },
      { id: "friendsAndNearbyPlayers", value: 3 },
      { id: "everyone", value: 4 },
    ],
  },
  MaxAccountsPerUser: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "unlimited" },
  },
  MaxPlayers: {
    type: "integer",
    defaultValue: 32,
    minimum: 1,
    maximum: 254,
  },
  PingLimit: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "disabled" },
  },
  SteamScoreboard: { type: "boolean", defaultValue: false },

  // Build 42-only options
  AnnounceAnimalDeath: { type: "boolean", defaultValue: false },
  AntiCheatChecksum: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatHit: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatNoClip: {
    type: "integer",
    defaultValue: 4,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatPacketException: {
    type: "integer",
    defaultValue: 4,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatPermission: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatPlayer: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatSafeHouse: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatSafety: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatSpeed: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  AntiCheatXP: {
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 4,
    choices: antiCheatPolicyChoices,
  },
  BadWordListFile: { type: "string", defaultValue: "" },
  BadWordPolicy: {
    type: "integer",
    defaultValue: 3,
    minimum: 1,
    maximum: 3,
    choices: antiCheatPolicyChoices.slice(0, 3),
  },
  BadWordReplacement: {
    type: "string",
    defaultValue: "[HIDDEN]",
    maximumLength: 16,
  },
  ChatMessageCharacterLimit: {
    type: "integer",
    defaultValue: 200,
    minimum: 64,
    maximum: 1024,
  },
  ChatMessageSlowModeTime: {
    type: "integer",
    defaultValue: 3,
    minimum: 1,
    maximum: 30,
  },
  DisableBurntTowing: { type: "boolean", defaultValue: false },
  DisableSafehouseWhenOwnerConnected: { type: "boolean", defaultValue: false },
  DisableScoreboard: { type: "boolean", defaultValue: false },
  DisableTrailerTowing: { type: "boolean", defaultValue: false },
  DisableVehicleTowing: { type: "boolean", defaultValue: false },
  DiscordChatChannel: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    writeOnly: true,
  },
  DiscordCommandChannel: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    writeOnly: true,
  },
  DiscordLogChannel: {
    type: "string",
    requirements: [{ option: "DiscordEnable", equals: true }],
    writeOnly: true,
  },
  GoodWordListFile: { type: "string", defaultValue: "" },
  HideAdminsInPlayerList: { type: "boolean", defaultValue: false },
  HideDisguisedUserName: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "UsernameDisguises", equals: true }],
  },
  MaxPacketsPerSecond: {
    type: "integer",
    defaultValue: 300,
    minimum: 100,
    maximum: 1000,
  },
  MaxSafezoneSize: {
    type: "integer",
    defaultValue: 20000,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "unlimited" },
  },
  MultiplayerStatisticsPeriod: {
    type: "integer",
    defaultValue: 1,
    minimum: 0,
    maximum: 10,
    specialValue: { value: 0, meaning: "disabled" },
  },
  PVPLogToolChat: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPLogToolFile: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "PVP", equals: true }],
  },
  SafehouseDisableDisguises: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "UsernameDisguises", equals: true }],
  },
  SafehousePreventsLootRespawn: { type: "boolean", defaultValue: true },
  SafetyDisconnectDelay: {
    type: "integer",
    defaultValue: 60,
    minimum: 0,
    maximum: 60,
  },
  Seed: { type: "string", defaultValue: "", dynamicDefault: true },
  ShowCoordinates: { type: "boolean", defaultValue: false },
  SwitchZombiesOwnershipEachUpdate: { type: "boolean", defaultValue: false },
  UltraSpeedDoesnotAffectToAnimals: { type: "boolean", defaultValue: false },
  UsePhysicsHitReaction: { type: "boolean", defaultValue: false },
  UsernameDisguises: { type: "boolean", defaultValue: false },
  War: { type: "boolean", defaultValue: false },
  WarDuration: {
    type: "integer",
    defaultValue: 3600,
    minimum: 60,
    maximum: 2147483647,
    requirements: [{ option: "War", equals: true }],
  },
  WarSafehouseHitPoints: {
    type: "integer",
    defaultValue: 3,
    minimum: 0,
    maximum: 2147483647,
    requirements: [{ option: "War", equals: true }],
    specialValue: { value: 0, meaning: "unlimited" },
  },
  WarStartDelay: {
    type: "integer",
    defaultValue: 600,
    minimum: 60,
    maximum: 2147483647,
    requirements: [{ option: "War", equals: true }],
  },
  WebhookAddress: { type: "string", defaultValue: "" },
} satisfies Record<string, OptionMetadata>;
function selectOptions<T extends Record<string, OptionMetadata>>(
  definitions: T,
  names: readonly Extract<keyof T, string>[],
): OptionDefinition[] {
  return names.map((name) => ({ name, ...definitions[name] }));
}

const b41 = (names: readonly (keyof typeof build41Options)[]) =>
  selectOptions(build41Options, names);

const b42 = (names: readonly (keyof typeof build42Options)[]) =>
  selectOptions(build42Options, names);

export const optionCatalogs: Record<GameBuild, OptionCategory[]> = {
  "41": [
    {
      id: "server",
      sections: [
        {
          id: "identityAndListing",
          options: b41([
            "PublicName",
            "PublicDescription",
            "ServerWelcomeMessage",
            "Public",
          ]),
        },
        {
          id: "accessAndCapacity",
          options: b41([
            "Open",
            "MaxPlayers",
            "MaxAccountsPerUser",
            "AutoCreateUserInWhiteList",
            "DropOffWhiteListAfterDeath",
            "AllowNonAsciiUsername",
            "AllowCoop",
          ]),
        },
        {
          id: "networkAndConnection",
          options: b41([
            "DefaultPort",
            "UDPPort",
            "UPnP",
            "server_browser_announced_ip",
          ]),
        },
        {
          id: "admissionAndQueue",
          options: b41([
            "DenyLoginOnOverloadedServer",
            "LoginQueueEnabled",
            "LoginQueueConnectTimeout",
          ]),
        },
        {
          id: "performance",
          options: b41(["PingLimit"]),
        },
        {
          id: "modsAndWorkshop",
          options: b41(["WorkshopItems", "Mods"]),
        },
        {
          id: "integrations",
          options: b41([
            "DiscordEnable",
            "DiscordToken",
            "DiscordChannel",
            "DiscordChannelID",
          ]),
        },
      ],
    },
    {
      id: "gameplay",
      sections: [
        {
          id: "spawningAndRespawn",
          options: b41([
            "SpawnItems",
            "SpawnPoint",
            "PlayerRespawnWithSelf",
            "PlayerRespawnWithOther",
          ]),
        },
        {
          id: "identityAndVisibility",
          options: b41([
            "DisplayUserName",
            "ShowFirstAndLastName",
            "MouseOverToSeeDisplayName",
            "SteamScoreboard",
            "MapRemotePlayerVisibility",
            "SneakModeHideFromOtherPlayers",
            "HidePlayersBehindYou",
          ]),
        },
        {
          id: "playerBehavior",
          options: b41([
            "MinutesPerPage",
            "PlayerBumpPlayer",
            "KnockedDownAllowed",
          ]),
        },
        {
          id: "timeAndSleep",
          options: b41([
            "PauseEmpty",
            "SleepAllowed",
            "SleepNeeded",
            "FastForwardMultiplier",
          ]),
        },
        {
          id: "world",
          options: b41([
            "Map",
            "NoFire",
            "BloodSplatLifespanDays",
            "RemovePlayerCorpsesOnCorpseRemoval",
            "TrashDeleteAll",
          ]),
        },
        {
          id: "vehicles",
          options: b41(["SpeedLimit", "CarEngineAttractionModifier"]),
        },
        {
          id: "lootAndConstruction",
          options: b41([
            "HoursForLootRespawn",
            "MaxItemsForLootRespawn",
            "ConstructionPreventsLootRespawn",
            "ItemNumbersLimitPerContainer",
            "AllowDestructionBySledgehammer",
            "SledgehammerOnlyInSafehouse",
          ]),
        },
        {
          id: "pvpAndSafety",
          options: b41([
            "PVP",
            "SafetySystem",
            "ShowSafety",
            "SafetyToggleTimer",
            "SafetyCooldownTimer",
            "PVPFirearmDamageModifier",
            "PVPMeleeDamageModifier",
            "PVPMeleeWhileHitReaction",
          ]),
        },
      ],
    },
    {
      id: "social",
      sections: [
        {
          id: "safehouses",
          options: b41([
            "PlayerSafehouse",
            "AdminSafehouse",
            "SafehouseDaySurvivedToClaim",
            "SafehouseAllowNonResidential",
            "SafehouseAllowRespawn",
            "SafeHouseRemovalTime",
            "DisableSafehouseWhenPlayerConnected",
            "SafehouseAllowTrepass",
            "SafehouseAllowLoot",
            "SafehouseAllowFire",
          ]),
        },
        {
          id: "factions",
          options: b41([
            "Faction",
            "FactionDaySurvivedToCreate",
            "FactionPlayersRequiredForTag",
          ]),
        },
        {
          id: "chatAndVoice",
          options: b41([
            "GlobalChat",
            "ChatStreams",
            "AnnounceDeath",
            "BanKickGlobalSound",
            "VoiceEnable",
            "Voice3D",
            "VoiceMinDistance",
            "VoiceMaxDistance",
            "DisableRadioStaff",
            "DisableRadioAdmin",
            "DisableRadioModerator",
            "DisableRadioOverseer",
            "DisableRadioGM",
            "DisableRadioInvisible",
          ]),
        },
      ],
    },
    {
      id: "maintenance",
      sections: [
        {
          id: "savingAndBackups",
          options: b41([
            "SaveWorldEveryMinutes",
            "BackupsOnStart",
            "BackupsOnVersionChange",
            "BackupsPeriod",
            "BackupsCount",
          ]),
        },
        {
          id: "loggingAndDiagnostics",
          options: b41(["PerkLogs", "ClientActionLogs", "ClientCommandFilter"]),
        },
        {
          id: "internalIdentifiers",
          options: b41(["ResetID", "ServerPlayerID"]),
        },
      ],
    },
    {
      id: "security",
      sections: [
        {
          id: "protections",
          options: b41(["SteamVAC", "DoLuaChecksum", "KickFastPlayers"]),
        },
        {
          id: "antiCheat",
          options: b41([
            "AntiCheatProtectionType1",
            "AntiCheatProtectionType2",
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
            "AntiCheatProtectionType20",
            "AntiCheatProtectionType20ThresholdMultiplier",
            "AntiCheatProtectionType21",
            "AntiCheatProtectionType22",
            "AntiCheatProtectionType22ThresholdMultiplier",
            "AntiCheatProtectionType23",
            "AntiCheatProtectionType24",
            "AntiCheatProtectionType24ThresholdMultiplier",
          ]),
        },
      ],
    },
  ],
  "42": [
    {
      id: "server",
      sections: [
        {
          id: "identityAndListing",
          options: b42([
            "PublicName",
            "PublicDescription",
            "ServerWelcomeMessage",
            "Public",
          ]),
        },
        {
          id: "accessAndCapacity",
          options: b42([
            "Open",
            "MaxPlayers",
            "MaxAccountsPerUser",
            "DropOffWhiteListAfterDeath",
            "AllowNonAsciiUsername",
            "AllowCoop",
          ]),
        },
        {
          id: "networkAndConnection",
          options: b42([
            "DefaultPort",
            "UDPPort",
            "UPnP",
            "server_browser_announced_ip",
          ]),
        },
        {
          id: "admissionAndQueue",
          options: b42([
            "DenyLoginOnOverloadedServer",
            "LoginQueueEnabled",
            "LoginQueueConnectTimeout",
          ]),
        },
        {
          id: "performance",
          options: b42([
            "PingLimit",
            "MaxPacketsPerSecond",
            "SwitchZombiesOwnershipEachUpdate",
          ]),
        },
        {
          id: "modsAndWorkshop",
          options: b42(["WorkshopItems", "Mods"]),
        },
        {
          id: "integrations",
          options: b42([
            "DiscordEnable",
            "DiscordToken",
            "DiscordChatChannel",
            "DiscordCommandChannel",
            "DiscordLogChannel",
            "WebhookAddress",
          ]),
        },
      ],
    },
    {
      id: "gameplay",
      sections: [
        {
          id: "spawningAndRespawn",
          options: b42([
            "SpawnItems",
            "SpawnPoint",
            "PlayerRespawnWithSelf",
            "PlayerRespawnWithOther",
          ]),
        },
        {
          id: "identityAndVisibility",
          options: b42([
            "DisplayUserName",
            "ShowFirstAndLastName",
            "MouseOverToSeeDisplayName",
            "SteamScoreboard",
            "DisableScoreboard",
            "UsernameDisguises",
            "HideDisguisedUserName",
            "HideAdminsInPlayerList",
            "MapRemotePlayerVisibility",
            "SneakModeHideFromOtherPlayers",
            "HidePlayersBehindYou",
          ]),
        },
        {
          id: "playerBehavior",
          options: b42([
            "PlayerBumpPlayer",
            "KnockedDownAllowed",
            "UsePhysicsHitReaction",
          ]),
        },
        {
          id: "timeAndSleep",
          options: b42([
            "PauseEmpty",
            "SleepAllowed",
            "SleepNeeded",
            "FastForwardMultiplier",
            "UltraSpeedDoesnotAffectToAnimals",
          ]),
        },
        {
          id: "world",
          options: b42([
            "Map",
            "Seed",
            "ShowCoordinates",
            "NoFire",
            "BloodSplatLifespanDays",
            "RemovePlayerCorpsesOnCorpseRemoval",
            "TrashDeleteAll",
          ]),
        },
        {
          id: "vehicles",
          options: b42([
            "SpeedLimit",
            "CarEngineAttractionModifier",
            "DisableVehicleTowing",
            "DisableTrailerTowing",
            "DisableBurntTowing",
          ]),
        },
        {
          id: "lootAndConstruction",
          options: b42([
            "ItemNumbersLimitPerContainer",
            "AllowDestructionBySledgehammer",
            "SledgehammerOnlyInSafehouse",
          ]),
        },
        {
          id: "pvpAndSafety",
          options: b42([
            "PVP",
            "SafetySystem",
            "ShowSafety",
            "SafetyToggleTimer",
            "SafetyCooldownTimer",
            "SafetyDisconnectDelay",
            "PVPFirearmDamageModifier",
            "PVPMeleeDamageModifier",
            "PVPMeleeWhileHitReaction",
            "PVPLogToolChat",
            "PVPLogToolFile",
          ]),
        },
      ],
    },
    {
      id: "social",
      sections: [
        {
          id: "safehouses",
          options: b42([
            "PlayerSafehouse",
            "AdminSafehouse",
            "SafehouseDaySurvivedToClaim",
            "SafehouseAllowNonResidential",
            "MaxSafezoneSize",
            "SafehouseAllowRespawn",
            "SafeHouseRemovalTime",
            "DisableSafehouseWhenOwnerConnected",
            "SafehouseAllowTrepass",
            "SafehouseAllowLoot",
            "SafehouseAllowFire",
            "SafehousePreventsLootRespawn",
            "SafehouseDisableDisguises",
            "War",
            "WarStartDelay",
            "WarDuration",
            "WarSafehouseHitPoints",
          ]),
        },
        {
          id: "factions",
          options: b42([
            "Faction",
            "FactionDaySurvivedToCreate",
            "FactionPlayersRequiredForTag",
          ]),
        },
        {
          id: "chatAndVoice",
          options: b42([
            "GlobalChat",
            "ChatStreams",
            "AnnounceDeath",
            "AnnounceAnimalDeath",
            "BanKickGlobalSound",
            "ChatMessageCharacterLimit",
            "ChatMessageSlowModeTime",
            "BadWordListFile",
            "GoodWordListFile",
            "BadWordPolicy",
            "BadWordReplacement",
            "VoiceEnable",
            "Voice3D",
            "VoiceMinDistance",
            "VoiceMaxDistance",
            "DisableRadioStaff",
            "DisableRadioAdmin",
            "DisableRadioModerator",
            "DisableRadioOverseer",
            "DisableRadioGM",
            "DisableRadioInvisible",
          ]),
        },
      ],
    },
    {
      id: "maintenance",
      sections: [
        {
          id: "savingAndBackups",
          options: b42([
            "SaveWorldEveryMinutes",
            "BackupsOnStart",
            "BackupsOnVersionChange",
            "BackupsPeriod",
            "BackupsCount",
          ]),
        },
        {
          id: "loggingAndDiagnostics",
          options: b42([
            "PerkLogs",
            "ClientActionLogs",
            "ClientCommandFilter",
            "MultiplayerStatisticsPeriod",
          ]),
        },
        {
          id: "internalIdentifiers",
          options: b42(["ResetID", "ServerPlayerID"]),
        },
      ],
    },
    {
      id: "security",
      sections: [
        {
          id: "protections",
          options: b42(["SteamVAC", "DoLuaChecksum"]),
        },
        {
          id: "antiCheat",
          options: b42([
            "AntiCheatChecksum",
            "AntiCheatHit",
            "AntiCheatNoClip",
            "AntiCheatPacketException",
            "AntiCheatPermission",
            "AntiCheatPlayer",
            "AntiCheatSafeHouse",
            "AntiCheatSafety",
            "AntiCheatSpeed",
            "AntiCheatXP",
          ]),
        },
      ],
    },
  ],
};

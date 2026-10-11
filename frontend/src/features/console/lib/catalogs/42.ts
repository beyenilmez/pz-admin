import type { ConsoleCatalog, ConsoleCommand } from "../../types";

export const build42AccessLevels = [
  "admin",
  "moderator",
  "gm",
  "observer",
  "priority",
  "user",
] as const;

export const build42BooleanFlags = ["-true", "-false"] as const;

export const build42ConsoleCommands = [
  {
    name: "additem",
    completions: { 0: "onlinePlayers", 1: "items" },
  },
  { name: "addsteamid" },
  {
    name: "addtosafehouse",
    completions: { 1: "onlinePlayers" },
  },
  { name: "adduser" },
  {
    name: "addvehicle",
    completions: { 0: "vehicles", 1: "onlinePlayers" },
  },
  {
    name: "addxp",
    completions: { 0: "onlinePlayers", 1: "skills" },
  },
  { name: "banid" },
  { name: "banip" },
  { name: "banuser", completions: { 0: "players" } },
  {
    name: "changeoption",
    completions: { 0: "optionNames", 1: "optionValues" },
  },
  { name: "chopper" },
  { name: "createhorde", completions: { 1: "onlinePlayers" } },
  {
    name: "godmodeplayer",
    completions: { 0: "onlinePlayers", 1: "booleanFlags" },
  },
  { name: "gunshot" },
  { name: "help", completions: { 0: "commands" } },
  {
    name: "invisibleplayer",
    completions: { 0: "onlinePlayers", 1: "booleanFlags" },
  },
  { name: "kick", completions: { 0: "onlinePlayers" } },
  {
    name: "kickfromsafehouse",
    completions: { 1: "players" },
  },
  { name: "lightning", completions: { 0: "onlinePlayers" } },
  {
    name: "noclip",
    completions: { 0: "onlinePlayers", 1: "booleanFlags" },
  },
  { name: "players" },
  { name: "quit" },
  { name: "releasesafehouse" },
  { name: "reloadalllua" },
  { name: "reloadlua" },
  { name: "reloadoptions" },
  { name: "removemapsymbolsforuser", completions: { 0: "players" } },
  { name: "removesteamid" },
  { name: "removeuserfromwhitelist", completions: { 0: "players" } },
  { name: "save" },
  { name: "servermsg" },
  {
    name: "setaccesslevel",
    completions: { 0: "players", 1: "accessLevels" },
  },
  { name: "setpassword", completions: { 0: "players" } },
  { name: "showoptions" },
  { name: "startrain" },
  { name: "startstorm" },
  { name: "stoprain" },
  { name: "stopweather" },
  {
    name: "teleportplayer",
    completions: { 0: "onlinePlayers", 1: "onlinePlayers" },
  },
  { name: "teleportto", completions: { 0: "onlinePlayers" } },
  { name: "thunder", completions: { 0: "onlinePlayers" } },
  { name: "unbanid" },
  { name: "unbanip" },
  { name: "unbanuser", completions: { 0: "players" } },
  {
    name: "voiceban",
    completions: { 0: "onlinePlayers", 1: "booleanFlags" },
  },
] as const satisfies readonly ConsoleCommand[];

export const build42CommandNames = build42ConsoleCommands.map(
  (command) => command.name,
);
build42CommandNames.sort((first, second) => first.localeCompare(second));

export const build42ConsoleCatalog: ConsoleCatalog = {
  commands: build42ConsoleCommands,
  values: {
    accessLevels: build42AccessLevels,
    booleanFlags: build42BooleanFlags,
    commands: build42CommandNames,
  },
};

import type { ConsoleCatalog, ConsoleCommand } from "../../types";

export const build41AccessLevels = [
  "admin",
  "moderator",
  "overseer",
  "gm",
  "observer",
  "none",
] as const;

export const build41BooleanFlags = ["-true", "-false"] as const;

export const build41ConsoleCommands = [
  {
    name: "additem",
    completions: { 0: "onlinePlayers", 1: "items" },
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
  { name: "unbanid" },
  { name: "banuser", completions: { 0: "players" } },
  { name: "unbanuser", completions: { 0: "players" } },
  {
    name: "changeoption",
    completions: { 0: "optionNames", 1: "optionValues" },
  },
  { name: "chopper" },
  { name: "createhorde", completions: { 1: "onlinePlayers" } },
  {
    name: "godmode",
    completions: { 0: "onlinePlayers", 1: "booleanFlags" },
  },
  { name: "gunshot" },
  { name: "help", completions: { 0: "commands" } },
  { name: "kick", completions: { 0: "onlinePlayers" } },
  { name: "lightning", completions: { 0: "onlinePlayers" } },
  { name: "thunder", completions: { 0: "onlinePlayers" } },
  { name: "players" },
  { name: "quit" },
  { name: "reloadlua" },
  { name: "reloadoptions" },
  { name: "removeuserfromwhitelist", completions: { 0: "players" } },
  { name: "save" },
  { name: "servermsg" },
  {
    name: "setaccesslevel",
    completions: { 0: "players", 1: "accessLevels" },
  },
  { name: "showoptions" },
  { name: "startrain" },
  { name: "startstorm" },
  { name: "stoprain" },
  { name: "stopweather" },
  {
    name: "teleport",
    completions: { 0: "onlinePlayers", 1: "onlinePlayers" },
  },
  { name: "teleportto", completions: { 0: "onlinePlayers" } },
  {
    name: "voiceban",
    completions: { 0: "onlinePlayers", 1: "booleanFlags" },
  },
] as const satisfies readonly ConsoleCommand[];

export const build41CommandNames = build41ConsoleCommands.map(
  (command) => command.name,
);
build41CommandNames.sort((first, second) => first.localeCompare(second));

export const build41ConsoleCatalog: ConsoleCatalog = {
  commands: build41ConsoleCommands,
  values: {
    accessLevels: build41AccessLevels,
    booleanFlags: build41BooleanFlags,
    commands: build41CommandNames,
  },
};

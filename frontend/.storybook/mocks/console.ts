import { fn } from "storybook/test";
import { isOnline } from "@/features/players/status";
import { makePlayers } from "./fixtures";
export const Execute = fn(async (command: string) => {
  if (command.trim().toLowerCase() !== "players")
    throw new Error("This example command has no configured response.");
  const players = makePlayers().filter(isOnline);
  return `Players connected (${players.length}):\n${players.map(({ username }) => `-${username}`).join("\n")}`;
}).mockName("Console.Execute");

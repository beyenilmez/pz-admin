export interface ConsoleCompletionValues {
  accessLevels: readonly string[];
  booleanFlags: readonly string[];
  commands: readonly string[];
  items: readonly string[];
  onlinePlayers: readonly string[];
  optionNames: readonly string[];
  optionValues: readonly string[];
  players: readonly string[];
  skills: readonly string[];
  vehicles: readonly string[];
}

export type ConsoleCompletionSource = keyof ConsoleCompletionValues;

export interface ConsoleCommand {
  completions?: Partial<Record<number, ConsoleCompletionSource>>;
  name: string;
}

export interface ConsoleCatalog {
  commands: readonly ConsoleCommand[];
  values: Partial<ConsoleCompletionValues>;
}

export interface ConsoleEntry {
  command: string;
  id: number;
  result?: string;
  status: "pending" | "success" | "error";
}

import type { GameBuild } from "@/features/game/types";
import { optionCatalogs } from "@/features/options/catalog";
import { build41ConsoleCatalog } from "./catalogs/41";
import { build42ConsoleCatalog } from "./catalogs/42";
import { rankedConsoleSuggestions } from "./matching";
import type { ConsoleCatalog, ConsoleCompletionValues } from "../types";

const emptyCatalog: ConsoleCatalog = { commands: [], values: {} };
const catalogs: Record<GameBuild, ConsoleCatalog> = {
  "41": build41ConsoleCatalog,
  "42": build42ConsoleCatalog,
};
export const clearConsoleCommand = "cls";
export const localConsoleCommandNames = [clearConsoleCommand];
function sortedStrings(values: readonly string[]) {
  const sorted = [...values];
  sorted.sort((first, second) => first.localeCompare(second));
  return sorted;
}

const commandNames: Record<GameBuild, readonly string[]> = {
  "41": sortedStrings([
    ...localConsoleCommandNames,
    ...(build41ConsoleCatalog.values.commands ?? []),
  ]),
  "42": sortedStrings([
    ...localConsoleCommandNames,
    ...(build42ConsoleCatalog.values.commands ?? []),
  ]),
};
const maximumSuggestions = 50;

export function consoleCatalog(build: GameBuild) {
  return catalogs[build];
}

export interface ConsoleSuggestions {
  anchorPosition: number;
  matches: readonly string[];
  quote: '"' | "'" | null;
  query: string;
  replacementEnd: number;
  replacementStart: number;
}

interface ConsoleCompletionContext {
  activeToken: string;
  anchorPosition: number;
  argumentValues: readonly string[];
  commandPosition: boolean;
  quote: '"' | "'" | null;
  replacementEnd: number;
  replacementStart: number;
  source: keyof ConsoleCompletionValues | null;
}

interface ConsoleToken {
  contentEnd: number;
  contentStart: number;
  end: number;
  quote: '"' | "'" | null;
  start: number;
  value: string;
}

function isQuote(character: string): character is '"' | "'" {
  return character === '"' || character === "'";
}

function consoleTokens(input: string): ConsoleToken[] {
  const tokens: ConsoleToken[] = [];
  let position = 0;

  while (position < input.length) {
    while (position < input.length && /\s/.test(input[position])) position += 1;
    if (position === input.length) break;

    const start = position;
    const firstCharacter = input[position];
    const quote = isQuote(firstCharacter) ? firstCharacter : null;
    let activeQuote: '"' | "'" | null = null;
    let closingQuote: number | null = null;

    while (position < input.length) {
      const character = input[position];
      if (character === "\\" && position + 1 < input.length) {
        position += 2;
        continue;
      }
      if (activeQuote) {
        if (character === activeQuote) {
          if (quote === activeQuote && closingQuote === null) {
            closingQuote = position;
          }
          activeQuote = null;
        }
        position += 1;
        continue;
      }
      if (isQuote(character)) {
        activeQuote = character;
        position += 1;
        continue;
      }
      if (/\s/.test(character)) break;
      position += 1;
    }

    const end = position;
    const contentStart = quote ? start + 1 : start;
    const contentEnd = quote && closingQuote !== null ? closingQuote : end;
    tokens.push({
      contentEnd,
      contentStart,
      end,
      quote,
      start,
      value: input.slice(contentStart, contentEnd),
    });
  }

  return tokens;
}

function completionContext(
  build: GameBuild | undefined,
  input: string,
  caretPosition: number,
): ConsoleCompletionContext {
  const caret = Math.min(Math.max(caretPosition, 0), input.length);
  const tokens = consoleTokens(input);
  const activeTokenIndex = tokens.findIndex(
    (token) => caret >= token.start && caret <= token.end,
  );
  const activeToken = activeTokenIndex === -1 ? null : tokens[activeTokenIndex];
  const precedingTokens = (
    activeTokenIndex === -1 ? tokens : tokens.slice(0, activeTokenIndex)
  ).filter((token) => token.end <= caret);
  const replacementStart = activeToken?.start ?? caret;
  const replacementEnd = activeToken?.end ?? caret;
  const queryEnd = activeToken
    ? Math.min(
        Math.max(caret, activeToken.contentStart),
        activeToken.contentEnd,
      )
    : caret;
  const catalog = build ? consoleCatalog(build) : emptyCatalog;
  const commandToken = precedingTokens[0];
  const command = commandToken?.quote
    ? undefined
    : catalog.commands.find(
        (candidate) =>
          candidate.name.toLowerCase() === commandToken?.value.toLowerCase(),
      );

  return {
    activeToken: activeToken
      ? input.slice(activeToken.contentStart, queryEnd)
      : "",
    anchorPosition: activeToken?.contentStart ?? caret,
    argumentValues: precedingTokens.slice(1).map((token) => token.value),
    commandPosition: precedingTokens.length === 0,
    quote: activeToken?.quote ?? null,
    replacementEnd,
    replacementStart,
    source:
      precedingTokens.length === 0
        ? null
        : (command?.completions?.[precedingTokens.length - 1] ?? null),
  };
}

function optionValueSuggestions(
  build: GameBuild | undefined,
  optionName: string | undefined,
) {
  if (!build || !optionName) return [];

  const normalizedName = optionName.toLowerCase();
  const definition = optionCatalogs[build]
    .flatMap((category) => category.sections)
    .flatMap((section) => section.options)
    .find((option) => option.name.toLowerCase() === normalizedName);
  if (!definition) return [];

  if (definition.choices) {
    return definition.choices.map((choice) => String(choice.value));
  }
  if (definition.type === "boolean") return ["true", "false"];
  if (definition.specialValue) return [String(definition.specialValue.value)];
  return [];
}

export function consoleCompletionSource(
  build: GameBuild | undefined,
  input: string,
  caretPosition = input.length,
) {
  return completionContext(build, input, caretPosition).source;
}

export function consoleSuggestions(
  build: GameBuild | undefined,
  input: string,
  completionValues: ConsoleCompletionValues,
  caretPosition = input.length,
): ConsoleSuggestions {
  const context = completionContext(build, input, caretPosition);
  const candidates = context.commandPosition
    ? context.quote
      ? []
      : build
        ? commandNames[build]
        : localConsoleCommandNames
    : context.source === "optionValues"
      ? optionValueSuggestions(build, context.argumentValues[0])
      : context.source
        ? completionValues[context.source]
        : [];
  const matches = rankedConsoleSuggestions(
    candidates,
    context.activeToken,
    maximumSuggestions,
  );

  return {
    anchorPosition: context.anchorPosition,
    matches,
    quote: context.quote,
    query: context.activeToken,
    replacementEnd: context.replacementEnd,
    replacementStart: context.replacementStart,
  };
}

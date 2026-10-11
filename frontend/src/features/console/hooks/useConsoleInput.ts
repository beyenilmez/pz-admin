import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { useCombobox } from "@mantine/core";
import { consoleCompletionSource, consoleSuggestions } from "../lib/catalog";
import { useCommandHistory } from "./useCommandHistory";
import { useConsoleCompletions } from "./useConsoleCompletions";
import { useSession } from "@/features/session/SessionProvider";

interface UseConsoleInputOptions {
  executing: boolean;
  onExecute: (command: string) => void;
}

export function useConsoleInput({
  executing,
  onExecute,
}: UseConsoleInputOptions) {
  const { profile } = useSession();
  const [command, setCommand] = useState("");
  const [caretPosition, setCaretPosition] = useState(0);
  const history = useCommandHistory();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretPosition = useRef<number | null>(null);
  // Tracks explicit dismissal separately from an empty completion result.
  const suggestionsActive = useRef(false);
  const build =
    profile?.version === "41" || profile?.version === "42"
      ? profile.version
      : undefined;
  const completionSource = consoleCompletionSource(
    build,
    command,
    caretPosition,
  );
  const completionValues = useConsoleCompletions(build, completionSource);
  const suggestions = consoleSuggestions(
    build,
    command,
    completionValues,
    caretPosition,
  );
  const hasSuggestions = suggestions.matches.length > 0;
  const showSuggestions =
    hasSuggestions && (command.trim().length > 0 || combobox.dropdownOpened);

  useEffect(() => {
    if (
      hasSuggestions &&
      command.trim() &&
      suggestionsActive.current &&
      document.activeElement === inputRef.current
    ) {
      combobox.openDropdown();
    }
  }, [combobox, command, hasSuggestions]);

  useEffect(() => {
    if (!combobox.dropdownOpened) return undefined;
    if (!showSuggestions) {
      combobox.closeDropdown();
      return undefined;
    }
    const frame = requestAnimationFrame(() => combobox.selectFirstOption());
    return () => cancelAnimationFrame(frame);
  }, [caretPosition, combobox, command, showSuggestions]);

  useLayoutEffect(() => {
    if (pendingCaretPosition.current === null) return;

    const position = pendingCaretPosition.current;
    pendingCaretPosition.current = null;
    inputRef.current?.setSelectionRange(position, position);
  });

  function setBuffer(value: string, position = value.length) {
    setCommand(value);
    setCaretPosition(position);
    history.update(value);
  }

  function updateSuggestionVisibility(value: string, position: number) {
    const next = consoleSuggestions(build, value, completionValues, position);
    if (suggestionsActive.current && value.trim() && next.matches.length > 0) {
      combobox.openDropdown();
    } else {
      combobox.closeDropdown();
    }
  }

  function closeSuggestions() {
    suggestionsActive.current = false;
    combobox.closeDropdown();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    const position = event.currentTarget.selectionStart ?? value.length;
    suggestionsActive.current = true;
    setBuffer(value, position);
    updateSuggestionVisibility(value, position);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    const position = event.currentTarget.selectionStart ?? command.length;
    setCaretPosition(position);
    updateSuggestionVisibility(command, position);
  }

  function handleSelection(event: SyntheticEvent<HTMLInputElement>) {
    const position = event.currentTarget.selectionStart ?? command.length;
    setCaretPosition(position);
    updateSuggestionVisibility(command, position);
  }

  function navigateHistory(direction: -1 | 1) {
    const recalledCommand = history.navigate(direction);
    if (recalledCommand === null) return;

    closeSuggestions();
    setCommand(recalledCommand);
    setCaretPosition(recalledCommand.length);
  }

  function applyCompletion(value: string) {
    const before = command.slice(0, suggestions.replacementStart);
    const after = command.slice(suggestions.replacementEnd);
    const quote = suggestions.quote ?? (/\s/.test(value) ? '"' : "");
    const replacement = quote ? `${quote}${value}${quote}` : value;
    const separator = after.length === 0 && !value.endsWith("=") ? " " : "";
    const nextCommand = `${before}${replacement}${separator}${after}`;
    const nextPosition = before.length + replacement.length + separator.length;
    suggestionsActive.current = true;
    pendingCaretPosition.current = nextPosition;
    setBuffer(nextCommand, nextPosition);
    combobox.resetSelectedOption();
    updateSuggestionVisibility(nextCommand, nextPosition);
  }

  function submit() {
    const nextCommand = command.trim();
    if (!nextCommand || executing) return;

    history.record(nextCommand);
    closeSuggestions();
    setCommand("");
    setCaretPosition(0);
    onExecute(nextCommand);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const onlySuggestion = suggestions.matches[0];
    if (
      event.key === "Enter" &&
      suggestions.matches.length === 1 &&
      onlySuggestion.toLocaleLowerCase() ===
        suggestions.query.toLocaleLowerCase()
    ) {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === "Escape" && combobox.dropdownOpened) {
      event.preventDefault();
      closeSuggestions();
      return;
    }

    if (event.key === "Tab") {
      if (suggestions.matches.length === 0) return;
      event.preventDefault();
      suggestionsActive.current = true;
      if (!combobox.dropdownOpened) {
        combobox.openDropdown("keyboard");
        return;
      }
      const selectedIndex = combobox.getSelectedOptionIndex();
      applyCompletion(
        suggestions.matches[selectedIndex === -1 ? 0 : selectedIndex],
      );
      return;
    }

    if (
      combobox.dropdownOpened &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    navigateHistory(event.key === "ArrowUp" ? -1 : 1);
  }

  return {
    applyCompletion,
    caretAnchorPosition: suggestions.anchorPosition,
    closeSuggestions,
    combobox,
    command,
    handleChange,
    handleFocus,
    handleKeyDown,
    handleSelection,
    inputRef,
    showSuggestions,
    submit,
    suggestions,
  };
}

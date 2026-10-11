import { Combobox } from "@mantine/core";
import type { ConsoleSuggestions } from "@/features/console/lib/catalog";
import { consoleSuggestionSegments } from "@/features/console/lib/matching";
import classes from "../ConsolePage.module.css";

interface ConsoleSuggestionListProps {
  suggestions: ConsoleSuggestions;
}

export function ConsoleSuggestionList({
  suggestions,
}: ConsoleSuggestionListProps) {
  return (
    <Combobox.Dropdown className={classes.suggestions}>
      <Combobox.Options className={classes.suggestionOptions}>
        {suggestions.matches.map((suggestion) => (
          <Combobox.Option
            key={suggestion}
            value={suggestion}
            className={classes.suggestion}
          >
            {consoleSuggestionSegments(suggestion, suggestions.query).map(
              (segment) => (
                <span
                  key={segment.start}
                  className={
                    segment.matched ? classes.suggestionMatch : undefined
                  }
                >
                  {segment.text}
                </span>
              ),
            )}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox.Dropdown>
  );
}

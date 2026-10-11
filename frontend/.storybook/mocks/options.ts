import { fn } from "storybook/test";
import { optionCatalogs } from "@/features/options/catalog";
import { formatServerValue } from "@/features/options/lib/optionValues";
import { UpdateResult } from "@bindings/internal/options/models";

export function makeOptions(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const category of optionCatalogs["42"]) {
    for (const section of category.sections) {
      for (const option of section.options) {
        if (!option.writeOnly && option.defaultValue !== undefined) {
          values[option.name] = formatServerValue(option.defaultValue);
        }
      }
    }
  }
  return {
    ...values,
    PublicName: "Riverside Community",
    PublicDescription: "A friendly cooperative survival server.",
    ServerWelcomeMessage:
      "Welcome to Riverside Community. Cooperate, explore, survive.",
    MaxPlayers: "32",
  };
}
export const List = fn(async () => makeOptions()).mockName("Options.List");
export const Update = fn(
  async (changes: Record<string, string | undefined>) => {
    const values = { ...(await List()) };
    for (const [name, value] of Object.entries(changes)) {
      if (value !== undefined) values[name] = value;
    }
    List.mockResolvedValue(values);
    return new UpdateResult({ updated: Object.keys(changes), failed: {} });
  },
).mockName("Options.Update");

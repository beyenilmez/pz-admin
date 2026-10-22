import { fn } from "storybook/test";
import i18n from "@/i18n";
import { Config as ConfigModel } from "@bindings/internal/config/models";

export const Config = fn(
  async () =>
    new ConfigModel({
      language: i18n.language,
      theme: "light",
      downloadUpdatesOnStartup: true,
    }),
).mockName("Config");
export const SetLanguage = fn(async (_language: string) => {}).mockName(
  "SetLanguage",
);
export const SetTheme = fn(async (_theme: string) => {}).mockName("SetTheme");
export const SetDownloadUpdatesOnStartup = fn(
  async (_enabled: boolean) => {},
).mockName("SetDownloadUpdatesOnStartup");
export const SetDebugLogging = fn(async (_enabled: boolean) => {}).mockName(
  "SetDebugLogging",
);

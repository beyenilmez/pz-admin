import { useEffect, type ReactNode } from "react";
import { useGlobals } from "storybook/preview-api";
import type { Decorator, Loader } from "@storybook/react-vite";
import { AppConfigProvider } from "@/features/config/AppConfigProvider";
import { Config as ConfigModel } from "@bindings/internal/config/models";
import { Config, SetLanguage, SetTheme } from "../mocks/config";

export const loadAppConfig: Loader<unknown> = ({ globals }) => {
  Config.mockResolvedValue(
    new ConfigModel({
      language: globals.locale,
      theme: globals.theme,
      downloadUpdatesOnStartup: true,
    }),
  );
  return {};
};

// Preferences and the toolbar share the same language and theme controls.
function ConfigPreview({
  locale,
  theme,
  updateGlobals,
  children,
}: {
  locale: string;
  theme: string;
  updateGlobals: (globals: Record<string, unknown>) => void;
  children: ReactNode;
}) {
  useEffect(() => {
    SetLanguage.mockImplementation(async (nextLocale) => {
      updateGlobals({ locale: nextLocale });
    });
    SetTheme.mockImplementation(async (nextTheme) => {
      // The toolbar fixes the effective scheme even when System is selected.
      if (nextTheme !== "system") updateGlobals({ theme: nextTheme });
    });
    return () => {
      SetLanguage.mockReset();
      SetTheme.mockReset();
    };
  }, [updateGlobals]);
  return (
    <AppConfigProvider key={`${locale}:${theme}`}>{children}</AppConfigProvider>
  );
}

// Keep React hooks in a component, outside the Storybook hook function.
export const withAppConfig: Decorator = (Story) => {
  const [globals, updateGlobals] = useGlobals();
  return (
    <ConfigPreview
      locale={globals.locale}
      theme={globals.theme}
      updateGlobals={updateGlobals}
    >
      <Story />
    </ConfigPreview>
  );
};

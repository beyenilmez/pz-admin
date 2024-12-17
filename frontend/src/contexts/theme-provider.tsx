import {
  LogError,
  LogInfo,
  WindowSetDarkTheme,
  WindowSetLightTheme,
  WindowSetSystemDefaultTheme,
} from "@/wailsjs/runtime/runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { useConfig } from "./config-provider";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>; // Ensure setTheme is async
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: async () => {}, // Initial no-op async function
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  const { config, setConfigField } = useConfig();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    if (config) {
      setThemeState(config.theme as Theme);
    }
  }, [config?.theme]); // Update theme state when config changes

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    try {
      await setConfigField("theme", newTheme);
      setThemeState(newTheme);
      if (newTheme === "system") {
        WindowSetSystemDefaultTheme();
      } else if (newTheme === "light") {
        WindowSetLightTheme();
      } else {
        WindowSetDarkTheme();
      }

      LogInfo(`Set theme to ${newTheme}`);
    } catch (error) {
      LogError("Failed to set theme");
    }
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

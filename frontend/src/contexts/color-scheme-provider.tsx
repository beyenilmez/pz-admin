import React, { createContext, useContext, useEffect, useState } from "react";
import { useConfig } from "./config-provider";
import colorSchemes from "@/colorSchemes.json";

export type ColorScheme =
  | "default"
  | "midnightAsh"
  | "dawnMist"
  | "forestDawn"
  | "goldenEmber"; // Add other color schemes here

type ColorSchemeProviderProps = {
  children: React.ReactNode;
  defaultColorScheme?: ColorScheme;
};

type ColorSchemeProviderState = {
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => Promise<void>;
  updateColorScheme: () => void; // The new function to update the color scheme without parameters
};

const initialState: ColorSchemeProviderState = {
  colorScheme: "default", // Default color scheme
  setColorScheme: async () => {},
  updateColorScheme: () => {}, // Initial empty function
};

const ColorSchemeContext =
  createContext<ColorSchemeProviderState>(initialState);

export function ColorSchemeProvider({
  children,
  defaultColorScheme = "default",
  ...props
}: ColorSchemeProviderProps) {
  const { config, setConfigField } = useConfig();
  const [colorScheme, setColorSchemeState] =
    useState<ColorScheme>(defaultColorScheme);
  const [updateTrigger, setUpdateTrigger] = useState(0); // A trigger to force update

  // Sync color scheme with config
  useEffect(() => {
    if (config) {
      setColorSchemeState(config.colorScheme as ColorScheme);
    }
  }, [config?.colorScheme]);

  // Update the DOM with the selected color scheme
  useEffect(() => {
    const root = document.documentElement;
    // Remove all color scheme classes from the root element
    for (let i = 0; i < colorSchemes.colorSchemes.length; i++) {
      root.classList.remove(colorSchemes.colorSchemes[i].code);
    }

    // Add the new color scheme class
    root.classList.add(colorScheme);
  }, [colorScheme, updateTrigger]);

  // Function to update color scheme in the config
  const setColorScheme = async (newColorScheme: ColorScheme) => {
    try {
      await setConfigField("colorScheme", newColorScheme);
      setColorSchemeState(newColorScheme);
      console.log(`Set color scheme to ${newColorScheme}`);
    } catch (error) {
      console.error("Failed to set color scheme");
    }
  };

  // Function to manually trigger color scheme update
  const updateColorScheme = () => {
    // Increment the updateTrigger to force a re-run of the useEffect
    setUpdateTrigger((prev) => prev + 1);
  };

  const value = {
    colorScheme,
    setColorScheme,
    updateColorScheme, // Provide updateColorScheme in the context
  };

  return (
    <ColorSchemeContext.Provider {...props} value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export const useColorScheme = () => {
  const context = useContext(ColorSchemeContext);

  if (context === undefined) {
    throw new Error("useColorScheme must be used within a ColorSchemeProvider");
  }

  return context;
};

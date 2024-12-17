import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { main } from "@/wailsjs/go/models";
import {
  GetConfig,
  SetConfigField as SetConfigField_backend,
} from "@/wailsjs/go/main/App";
import { LogError } from "@/wailsjs/runtime/runtime";

interface ConfigContextType {
  config: main.Config | null;
  initialConfig: main.Config | null;
  setConfig: React.Dispatch<React.SetStateAction<main.Config | null>>;
  setConfigField: (key: keyof main.Config, value: any) => void;
}

// Create the context
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Create a provider component
export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<main.Config | null>(null);
  const [initialConfig, setInitialConfig] = useState<main.Config | null>(null);

  useEffect(() => {
    // Fetch the initial configuration
    GetConfig()
      .then((initialConfig: main.Config) => {
        setConfig(initialConfig);
        setInitialConfig(initialConfig);
      })
      .catch((error) => {
        LogError("Failed to fetch initial config: " + error);
      });
  }, []);

  const setConfigField = (key: keyof main.Config, value: any) => {
    if (config) {
      var strKey = key as string;
      strKey = strKey.charAt(0).toUpperCase() + strKey.slice(1);
      // Call the backend function to set the config field
      SetConfigField_backend(strKey, value)
        .then(() => {
          // Update the config state with the new value
          setConfig((prevConfig) => {
            if (prevConfig) {
              return { ...prevConfig, [key]: value };
            }
            return prevConfig;
          });
        })
        .catch((error) => {
          LogError("Failed to set config field " + key + ": " + error);
        });
    }
  };

  return (
    <ConfigContext.Provider
      value={{ config, initialConfig, setConfig, setConfigField }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the config context
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

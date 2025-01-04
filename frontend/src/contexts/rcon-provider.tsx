import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
} from "react";
import { ConnectRcon, DisconnectRcon, SendNotification, SendRconCommand, UpdatePzOptions } from "@/wailsjs/go/main/App";
import { main } from "@/wailsjs/go/models";
import { EventsOff, EventsOn, LogDebug } from "@/wailsjs/runtime/runtime";
import { deepEqual } from "@/lib/utils";
import { optionsMap } from "@/assets/options";

interface RconContextType {
  isConnected: boolean;
  isConnecting: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>;
  connect: (credentials: main.Credentials) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  sendCommand: (command: string) => Promise<main.RconResponse>;
  ip: string;
  port: string;
  players: main.Player[];

  options: main.PzOptions;
  modifiedOptions: main.PzOptions;
  modifyOption: (key: keyof main.PzOptions, value: main.PzOptions[keyof main.PzOptions]) => void;
  cancelModifiedOptions: () => void;
  optionsModified: boolean;
  updateOptions: () => Promise<boolean>;
  updatingOptions: boolean;
  optionsInvalid: boolean;

  reloadDoubleptions: () => void;
  reloadDoubleOptionsKey: number;
}

const RconContext = createContext<RconContextType | undefined>(undefined);

export const RconProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [players, setPlayers] = useState<main.Player[]>([]);

  const [options, setOptions] = useState<main.PzOptions>({} as main.PzOptions);
  const [modifiedOptions, setModifiedOptions] = useState<main.PzOptions>({} as main.PzOptions);
  const [updatingOptions, setUpdatingOptions] = useState(false);

  const [reloadDoubleOptionsKey, setReloadDoubleOptionsKey] = useState(0);

  const optionsModified = useMemo(() => !deepEqual(options, modifiedOptions), [options, modifiedOptions]);
  const optionsInvalid = useMemo(() => {
    return Object.entries(modifiedOptions).some(
      ([key, value]) =>
        value === null ||
        value === undefined ||
        (typeof value === "number" &&
          (isNaN(value) ||
            value < (optionsMap.get(key)?.Range?.Min ?? -2147483648) ||
            value > (optionsMap.get(key)?.Range?.Max ?? 2147483647)))
    );
  }, [modifiedOptions]);

  useEffect(() => {
    const handleUpdatePlayers = (players: main.Player[]) => {
      setPlayers(players);
    };

    const handleUpdateOptions = (newOptions: main.PzOptions) => {
      LogDebug(optionsModified + ", " + deepEqual(modifiedOptions, newOptions));
      console.log(modifiedOptions);
      console.log(newOptions);
      console.log(deepEqual(modifiedOptions, newOptions));
      if (optionsModified && modifiedOptions.Open !== undefined && !deepEqual(modifiedOptions, newOptions)) {
        SendNotification({
          title: "Options reloaded",
          message: "An option has been updated from somewhere else",
          variant: "warning",
        } as main.Notification);
      }

      setModifiedOptions(newOptions);
      setOptions(newOptions);
    };

    EventsOn("update-players", handleUpdatePlayers);
    EventsOn("update-options", handleUpdateOptions);

    return () => {
      EventsOff("update-players");
      EventsOff("update-options");
    };
  }, [modifiedOptions, options]);

  const connect = useCallback(async (credentials: main.Credentials): Promise<boolean> => {
    try {
      setIsConnecting(true);
      const result = await ConnectRcon(credentials);
      if (result) {
        setIp(credentials.ip);
        setPort(credentials.port);
      }
      setIsConnected(result);
      setIsConnecting(false);
      return result;
    } catch (error) {
      console.error("Error connecting to RCON:", error);
      setIsConnecting(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(async (): Promise<boolean> => {
    try {
      const result = await DisconnectRcon();
      setIsConnected(!result);
      setPlayers([]);
      setOptions({} as main.PzOptions);
      setModifiedOptions({} as main.PzOptions);
      setIp("");
      setPort("");
      setUpdatingOptions(false);
      return result;
    } catch (error) {
      console.error("Error disconnecting from RCON:", error);
      return false;
    }
  }, []);

  const sendCommand = useCallback(
    async (command: string): Promise<main.RconResponse> => {
      if (!isConnected) {
        console.warn("Cannot send command: Not connected to RCON");
        return {} as main.RconResponse;
      }
      try {
        return await SendRconCommand(command);
      } catch (error) {
        console.error("Error sending RCON command:", error);
        return {} as main.RconResponse;
      }
    },
    [isConnected]
  );

  const modifyOption = useCallback((key: keyof main.PzOptions, value: main.PzOptions[keyof main.PzOptions]) => {
    setModifiedOptions((prevOptions) => ({ ...prevOptions, [key]: value }));
  }, []);

  const updateOptions = useCallback(async () => {
    setUpdatingOptions(true);
    const success = await UpdatePzOptions(modifiedOptions);
    if (success) {
      LogDebug("Frontend: Options updated successfully");
      setOptions(modifiedOptions);
    }
    setUpdatingOptions(false);

    return success;
  }, [modifiedOptions]);

  const cancelModifiedOptions = useCallback(() => {
    setModifiedOptions(options as main.PzOptions);
  }, [options]);

  useEffect(() => {
    if (!isConnected) {
      setIp("");
      setPort("");
    }
  }, [isConnected]);

  const reloadDoubleptions = useCallback(() => {
    setReloadDoubleOptionsKey((prevKey) => prevKey + 1);
  }, [modifiedOptions]);

  return (
    <RconContext.Provider
      value={{
        isConnected,
        isConnecting,
        setIsConnected,
        connect,
        disconnect,
        sendCommand,
        ip,
        port,
        players,
        options,
        modifiedOptions,
        optionsModified,
        modifyOption,
        cancelModifiedOptions,
        updateOptions,
        updatingOptions,
        optionsInvalid,
        reloadDoubleptions,
        reloadDoubleOptionsKey,
      }}
    >
      {children}
    </RconContext.Provider>
  );
};

export const useRcon = (): RconContextType => {
  const context = useContext(RconContext);
  if (!context) {
    throw new Error("useRcon must be used within a RconProvider");
  }
  return context;
};

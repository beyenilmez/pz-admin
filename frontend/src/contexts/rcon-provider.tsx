import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { ConnectRcon, DisconnectRcon, SendNotification, SendRconCommand, UpdatePzOptions } from "@/wailsjs/go/main/App";
import { main } from "@/wailsjs/go/models";
import { EventsOn } from "@/wailsjs/runtime/runtime";

interface RconContextType {
  isConnected: boolean;
  isConnecting: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>; // Explicit state setter for external control
  connect: (credentials: main.Credentials) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  sendCommand: (command: string) => Promise<main.RconResponse>;
  ip: string;
  port: string;
  players: main.Player[];

  options: main.PzOptions;
  modifiedOptions: main.PzOptions;
  modifyOption: (key: keyof main.PzOptions, value: main.PzOptions[keyof main.PzOptions]) => void;
  optionsModified: boolean;
  updateOptions: () => Promise<boolean>;
  updatingOptions: boolean;
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
  const optionsModified = JSON.stringify(options) !== JSON.stringify(modifiedOptions);
  const [updatingOptions, setUpdatingOptions] = useState(false);

  useEffect(() => {
    EventsOn("update-players", (players: main.Player[]) => {
      //let newPlayers = players.sort((a, b) =>
      //  a.online === b.online ? a.name.localeCompare(b.name) : a.online ? -1 : 1
      //);
      //newPlayers.push({ name: "Online_player", online: true, accessLevel: "admin" } as main.Player);
      setPlayers(players);
    });

    EventsOn("update-options", (options: main.PzOptions) => {
      setOptions(options);

      if (JSON.stringify(modifiedOptions) === "{}") {
        setModifiedOptions(options);
      } else if (JSON.stringify(options) !== JSON.stringify(modifiedOptions)) {
        SendNotification({
          title: "Options reloaded",
          message: "An option has been updated from somewhere else",
          variant: "warning",
        } as main.Notification);
        setModifiedOptions(options);
      }
    });
  }, []);

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
      setOptions(modifiedOptions);
    }
    setUpdatingOptions(false);

    return success;
  }, [modifiedOptions]);

  useEffect(() => {
    if (!isConnected) {
      setIp("");
      setPort("");
    }
  }, [isConnected]);

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
        updateOptions,
        updatingOptions,
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

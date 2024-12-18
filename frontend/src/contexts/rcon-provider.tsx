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
import { ConnectRcon, DisconnectRcon, SendRconCommand } from "@/wailsjs/go/main/App";
import { main } from "@/wailsjs/go/models";

interface RconContextType {
  isConnected: boolean;
  isConnecting: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>; // Explicit state setter for external control
  connect: (credentials: main.Credentials) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  sendCommand: (command: string) => Promise<string | null>;
  ip: string;
  port: string;
}

const RconContext = createContext<RconContextType | undefined>(undefined);

export const RconProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");

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
    async (command: string): Promise<string | null> => {
      if (!isConnected) {
        console.warn("Cannot send command: Not connected to RCON");
        return null;
      }
      try {
        return await SendRconCommand(command);
      } catch (error) {
        console.error("Error sending RCON command:", error);
        return null;
      }
    },
    [isConnected]
  );

  useEffect(() => {
    if (!isConnected) {
      setIp("");
      setPort("");
    }
  }, [isConnected]);

  return (
    <RconContext.Provider
      value={{ isConnected, isConnecting, setIsConnected, connect, disconnect, sendCommand, ip, port }}
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

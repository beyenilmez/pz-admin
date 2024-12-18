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

interface RconContextType {
  isConnected: boolean;
  setIsConnected: Dispatch<SetStateAction<boolean>>; // Explicit state setter for external control
  connect: (ip: string, port: string, password: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  sendCommand: (command: string) => Promise<string | null>;
  ip: string;
  port: string;
}

const RconContext = createContext<RconContextType | undefined>(undefined);

export const RconProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");

  const connect = useCallback(async (ip: string, port: string, password: string): Promise<boolean> => {
    try {
      const result = await ConnectRcon(ip, port || "16261", password);
      if (result) {
        setIp(ip);
        setPort(port);
      }
      setIsConnected(result);
      return result;
    } catch (error) {
      console.error("Error connecting to RCON:", error);
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
    <RconContext.Provider value={{ isConnected, setIsConnected, connect, disconnect, sendCommand, ip, port }}>
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

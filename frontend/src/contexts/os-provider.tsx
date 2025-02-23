import { GetOs } from "@/wailsjs/go/main/App";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface OsContextType {
  os: "windows" | "darwin" | "linux" | "unknown";
}

// Create context with initial empty values
const OsContext = createContext<OsContextType>({
  os: "unknown",
});

// Custom hook to use OsContext
export function useOs(): OsContextType {
  return useContext(OsContext);
}

// OsProvider component
export const OsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [os, setOs] = useState<"windows" | "darwin" | "linux" | "unknown">("unknown");

  useEffect(() => {
    GetOs().then((os) => setOs(os as "windows" | "darwin" | "linux"));
  }, []);

  return (
    <OsContext.Provider
      value={{
        os,
      }}
    >
      {children}
    </OsContext.Provider>
  );
};

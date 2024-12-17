import React, { createContext, useContext, useState } from "react";

type ProgressProviderProps = {
  children: React.ReactNode;
};

type ProgressProviderState = {
  progress: number;
  setProgress: (progress: number) => void;
};

const initialState: ProgressProviderState = {
  progress: 0,
  setProgress: () => {}, // Initial no-op function
};

const ProgressProviderContext = createContext<ProgressProviderState>(initialState);

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useState<number>(initialState.progress);

  const value = {
    progress,
    setProgress,
  };

  return (
    <ProgressProviderContext.Provider value={value}>
      {children}
    </ProgressProviderContext.Provider>
  );
}

export const useProgress = () => {
  const context = useContext(ProgressProviderContext);

  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }

  return context;
};

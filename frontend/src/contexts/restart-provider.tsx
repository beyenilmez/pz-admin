import React, { createContext, useContext, useState, ReactNode } from "react";

interface RestartContextType {
  restartRequired: boolean;
  addRestartRequired: (item: string) => void;
  removeRestartRequired: (item: string) => void;
}

// Create context with initial empty values
const RestartContext = createContext<RestartContextType>({
  restartRequired: false,
  addRestartRequired: () => {},
  removeRestartRequired: () => {},
});

// Custom hook to use RestartContext
export function useRestart(): RestartContextType {
  return useContext(RestartContext);
}

// RestartProvider component
export const RestartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [_, setRestartRequiredArray] = useState<string[]>([]);
  const [restartRequired, setRestartRequired] = useState(false);

  // Function to add a restart requirement
  const addRestartRequired = (item: string) => {
    setRestartRequiredArray((prevArray) => {
      if (!prevArray.includes(item)) {
        const newArray = [...prevArray, item];
        setRestartRequired(newArray.length > 0);
        return newArray;
      }
      return prevArray;
    });
  };

  // Function to remove a restart requirement
  const removeRestartRequired = (item: string) => {
    setRestartRequiredArray((prevArray) => {
      const newArray = prevArray.filter((i) => i !== item);
      setRestartRequired(newArray.length > 0);
      return newArray;
    });
  };

  return (
    <RestartContext.Provider
      value={{
        restartRequired,
        addRestartRequired,
        removeRestartRequired,
      }}
    >
      {children}
    </RestartContext.Provider>
  );
};

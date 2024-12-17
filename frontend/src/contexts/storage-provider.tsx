import React, { createContext, useContext, useState, ReactNode } from "react";

interface StorageContextType {
  setValue: (key: string, value: any) => void;
  getValue: (key: string) => any;
  setValueIfUndefined: (key: string, value: any) => void;
}

interface StorageProviderProps {
  children: ReactNode;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<StorageProviderProps> = ({
  children,
}) => {
  const [storage, setStorage] = useState<{ [key: string]: any }>({});

  const setValue = (key: string, value: any) => {
    setStorage((prevStorage) => ({
      ...prevStorage,
      [key]: value,
    }));
  };

  const getValue = (key: string) => {
    return storage[key];
  };

  const setValueIfUndefined = (key: string, value: any) => {
    if (storage[key] === undefined) {
      setValue(key, value);
    }
  };

  const contextValue: StorageContextType = {
    setValue,
    getValue,
    setValueIfUndefined,
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
};

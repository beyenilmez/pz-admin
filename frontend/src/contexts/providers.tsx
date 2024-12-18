import { ReactNode } from "react";
import { RestartProvider } from "./restart-provider.tsx";
import { ThemeProvider } from "./theme-provider.tsx";
import { StorageProvider } from "./storage-provider.tsx";
import { ConfigProvider } from "./config-provider.tsx";
import { ProgressProvider } from "./progress-provider.tsx";
import { ColorSchemeProvider } from "./color-scheme-provider.tsx";
import { RconProvider } from "./rcon-provider.tsx";

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ConfigProvider>
      <RestartProvider>
        <ThemeProvider>
          <ColorSchemeProvider>
            <ProgressProvider>
              <StorageProvider>
                <RconProvider>{children}</RconProvider>
              </StorageProvider>
            </ProgressProvider>
          </ColorSchemeProvider>
        </ThemeProvider>
      </RestartProvider>
    </ConfigProvider>
  );
};

export default Providers;

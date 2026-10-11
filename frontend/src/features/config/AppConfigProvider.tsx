import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMantineColorScheme } from "@mantine/core";
import type { Config as ConfigModel } from "@bindings/internal/config/models";
import {
  Config,
  SetLanguage,
  SetTheme,
  SetDownloadUpdatesOnStartup,
} from "@bindings/internal/config/service";
import { errorMessage } from "@/shared/lib/errors";
import i18n from "@/i18n";
import {
  defaultLanguage,
  detectLanguage,
  isSupportedLanguage,
  type SupportedLanguage,
} from "@/i18n/locales";

export type ThemeSetting = "system" | "dark" | "light";
export type LanguageSetting = SupportedLanguage;

interface AppConfig {
  downloadUpdatesOnStartup: boolean;
  language: LanguageSetting;
  theme: ThemeSetting;
}

export function isThemeSetting(theme: string): theme is ThemeSetting {
  return theme === "system" || theme === "dark" || theme === "light";
}

function appConfigFromBinding(config: {
  downloadUpdatesOnStartup: boolean;
  language: string;
  theme: string;
}): AppConfig {
  if (!isThemeSetting(config.theme)) {
    throw new Error(`Unsupported theme: ${config.theme}`);
  }
  // Preserve selections saved before Chinese locales used script tags.
  let language = config.language;
  if (language === "zh-CN") language = "zh-Hans";
  else if (language === "zh-TW") language = "zh-Hant";

  return {
    downloadUpdatesOnStartup: config.downloadUpdatesOnStartup,
    language: isSupportedLanguage(language) ? language : defaultLanguage,
    theme: config.theme,
  };
}

interface AppConfigContextValue {
  config: AppConfig | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setLanguage: (language: LanguageSetting) => Promise<void>;
  setTheme: (theme: ThemeSetting) => Promise<void>;
  setDownloadUpdatesOnStartup: (enabled: boolean) => Promise<void>;
}

interface AppConfigProviderProps {
  children: ReactNode;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);
let configRequest: Promise<ConfigModel> | null = null;

function loadConfig() {
  if (configRequest) return configRequest;

  const request = Config().then(async (config) => {
    if (config.language !== "") return config;

    const language = detectLanguage(
      navigator.languages.length ? navigator.languages : [navigator.language],
    );
    await SetLanguage(language);
    return {
      theme: config.theme,
      language,
      downloadUpdatesOnStartup: config.downloadUpdatesOnStartup,
    };
  });
  configRequest = request;

  const clearRequest = () => {
    if (configRequest === request) configRequest = null;
  };

  void request.then(clearRequest, clearRequest);

  return request;
}

export function AppConfigProvider({ children }: AppConfigProviderProps) {
  const { setColorScheme } = useMantineColorScheme();
  const applyColorScheme = useEffectEvent(setColorScheme);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadRevision, setLoadRevision] = useState(0);
  const activeLanguage = config?.language;
  const reload = useCallback(
    () => setLoadRevision((revision) => revision + 1),
    [],
  );

  useEffect(() => {
    let active = true;
    setError(null);
    setLoading(true);

    async function initialize() {
      try {
        const loadedConfig = await loadConfig();
        if (!active) return;

        const nextConfig = appConfigFromBinding(loadedConfig);
        setConfig(nextConfig);
        applyColorScheme(
          nextConfig.theme === "system" ? "auto" : nextConfig.theme,
        );
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadRevision]);

  useEffect(() => {
    if (!activeLanguage) return;
    document.documentElement.lang = activeLanguage;
    void i18n.changeLanguage(activeLanguage);
  }, [activeLanguage]);

  const updateTheme = useCallback(
    async (theme: ThemeSetting) => {
      setError(null);
      try {
        await SetTheme(theme);
        setConfig((current) => current && { ...current, theme });
        setColorScheme(theme === "system" ? "auto" : theme);
      } catch (saveError) {
        setError(errorMessage(saveError));
      }
    },
    [setColorScheme],
  );

  const updateLanguage = useCallback(async (nextLanguage: LanguageSetting) => {
    setError(null);
    try {
      await SetLanguage(nextLanguage);
      setConfig((current) => current && { ...current, language: nextLanguage });
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }, []);

  const updateDownloadUpdatesOnStartup = useCallback(
    async (enabled: boolean) => {
      setError(null);
      try {
        await SetDownloadUpdatesOnStartup(enabled);
        setConfig(
          (current) =>
            current && { ...current, downloadUpdatesOnStartup: enabled },
        );
      } catch (saveError) {
        setError(errorMessage(saveError));
      }
    },
    [],
  );

  const value = useMemo<AppConfigContextValue>(
    () => ({
      config,
      error,
      loading,
      reload,
      setLanguage: updateLanguage,
      setTheme: updateTheme,
      setDownloadUpdatesOnStartup: updateDownloadUpdatesOnStartup,
    }),
    [
      config,
      error,
      loading,
      reload,
      updateLanguage,
      updateTheme,
      updateDownloadUpdatesOnStartup,
    ],
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context;
}

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
import { Events } from "@wailsio/runtime";
import { useMantineColorScheme } from "@mantine/core";
import type { Config as ConfigModel } from "@bindings/internal/config/models";
import {
  Config,
  SetLanguage,
  SetTheme,
  SetDownloadUpdatesOnStartup,
  SetDebugLogging,
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
  debugLogging: boolean;
  downloadUpdatesOnStartup: boolean;
  language: LanguageSetting;
  theme: ThemeSetting;
}

export function isThemeSetting(theme: string): theme is ThemeSetting {
  return theme === "system" || theme === "dark" || theme === "light";
}

function appConfigFromBinding(config: ConfigModel): AppConfig {
  if (!isThemeSetting(config.theme)) {
    throw new Error(`Unsupported theme: ${config.theme}`);
  }
  // Preserve selections saved before Chinese locales used script tags.
  let language = config.language;
  if (language === "zh-CN") language = "zh-Hans";
  else if (language === "zh-TW") language = "zh-Hant";

  return {
    debugLogging: config.debugLogging,
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
  setDebugLogging: (enabled: boolean) => Promise<void>;
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
    config.language = language;
    return config;
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
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const applyConfig = useEffectEvent((saved: ConfigModel) => {
    const nextConfig = appConfigFromBinding(saved);
    setConfig(nextConfig);
    setColorScheme(nextConfig.theme === "system" ? "auto" : nextConfig.theme);
    setError(null);
    setLoading(false);
  });
  const activeLanguage = config?.language;
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoading(true);
    const unsubscribe = Events.On("config:changed", ({ data }) => {
      if (!active) return;
      try {
        applyConfig(data);
      } catch (cause) {
        setError(errorMessage(cause));
      }
    });

    async function initialize() {
      try {
        const loadedConfig = await loadConfig();
        if (active) applyConfig(loadedConfig);
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  useEffect(() => {
    if (!activeLanguage) return;
    document.documentElement.lang = activeLanguage;
    void i18n.changeLanguage(activeLanguage);
  }, [activeLanguage]);

  const updateConfig = useCallback(
    async (save: () => Promise<unknown>, patch: Partial<AppConfig>) => {
      setError(null);
      try {
        await save();
        setConfig((current) => current && { ...current, ...patch });
        if (patch.theme) {
          setColorScheme(patch.theme === "system" ? "auto" : patch.theme);
        }
      } catch (saveError) {
        setError(errorMessage(saveError));
      }
    },
    [setColorScheme],
  );

  const value = useMemo<AppConfigContextValue>(
    () => ({
      config,
      error,
      loading,
      reload,
      setLanguage: (language) =>
        updateConfig(() => SetLanguage(language), { language }),
      setTheme: (theme) => updateConfig(() => SetTheme(theme), { theme }),
      setDebugLogging: (enabled) =>
        updateConfig(() => SetDebugLogging(enabled), { debugLogging: enabled }),
      setDownloadUpdatesOnStartup: (enabled) =>
        updateConfig(() => SetDownloadUpdatesOnStartup(enabled), {
          downloadUpdatesOnStartup: enabled,
        }),
    }),
    [config, error, loading, reload, updateConfig],
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

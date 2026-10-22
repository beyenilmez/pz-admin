import { Events } from "@wailsio/runtime";
import { StrictMode } from "react";
import { act, render, waitFor } from "@/test/render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Config as ConfigModel } from "@bindings/internal/config/models";
import {
  Config,
  SetLanguage,
  SetTheme,
  SetDownloadUpdatesOnStartup,
  SetDebugLogging,
} from "@bindings/internal/config/service";
import i18n from "@/i18n";
import { defaultLanguage } from "@/i18n/locales";
import { AppConfigProvider, useAppConfig } from "./AppConfigProvider";

const { setColorScheme } = vi.hoisted(() => ({
  setColorScheme: vi.fn(),
}));

vi.mock("@mantine/core", async (importOriginal) => {
  const mantine = await importOriginal<typeof import("@mantine/core")>();
  return {
    ...mantine,
    useMantineColorScheme: () => ({ setColorScheme }),
  };
});

vi.mock("@bindings/internal/config/service", () => ({
  Config: vi.fn(),
  SetLanguage: vi.fn(),
  SetTheme: vi.fn(),
  SetDownloadUpdatesOnStartup: vi.fn(),
  SetDebugLogging: vi.fn(),
}));

let appConfig: ReturnType<typeof useAppConfig>;

function ConfigProbe() {
  appConfig = useAppConfig();
  return null;
}

function renderProvider() {
  return render(
    <AppConfigProvider>
      <ConfigProbe />
    </AppConfigProvider>,
  );
}

beforeEach(() => {
  vi.mocked(Config).mockResolvedValue(
    new ConfigModel({
      language: defaultLanguage,
      theme: "system",
      debugLogging: false,
      downloadUpdatesOnStartup: true,
    }),
  );
  vi.mocked(SetLanguage).mockResolvedValue(undefined);
  vi.mocked(SetTheme).mockResolvedValue(undefined);
  vi.mocked(SetDebugLogging).mockResolvedValue(undefined);
  vi.mocked(SetDownloadUpdatesOnStartup).mockResolvedValue(undefined);
  vi.mocked(Events.On).mockImplementation(() => vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  document.documentElement.lang = defaultLanguage;
});

describe("AppConfigProvider", () => {
  it("detects and saves the initial language once under StrictMode", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["tr"]);
    vi.mocked(Config)
      .mockResolvedValueOnce(new ConfigModel({ language: "", theme: "system" }))
      .mockResolvedValue(
        new ConfigModel({ language: "tr-TR", theme: "system" }),
      );
    render(
      <StrictMode>
        <AppConfigProvider>
          <ConfigProbe />
        </AppConfigProvider>
      </StrictMode>,
    );
    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(appConfig.config?.language).toBe("tr-TR");
    expect(SetLanguage).toHaveBeenCalledExactlyOnceWith("tr-TR");

    act(() => appConfig.reload());
    await waitFor(() => expect(Config).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(SetLanguage).toHaveBeenCalledOnce();
  });

  it("persists English when no preferred language matches", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["sw"]);
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({ language: "", theme: "system" }),
    );
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(SetLanguage).toHaveBeenCalledExactlyOnceWith(defaultLanguage);
    expect(appConfig.config?.language).toBe(defaultLanguage);
  });

  it("exposes an initial language write failure and allows retry", async () => {
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({ language: "", theme: "system" }),
    );
    vi.mocked(SetLanguage)
      .mockRejectedValueOnce(new Error("language-write-failure"))
      .mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(appConfig.config).toBeNull();
    expect(appConfig.error).toBe("language-write-failure");
    act(() => appConfig.reload());
    await waitFor(() => expect(appConfig.config).not.toBeNull());
    expect(appConfig.error).toBeNull();
    expect(SetLanguage).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      expectedLanguage: "zh-Hans",
      expectedScheme: "auto",
      language: "zh-CN",
      theme: "system",
    },
    {
      expectedLanguage: "zh-Hant",
      expectedScheme: "auto",
      language: "zh-TW",
      theme: "system",
    },
    {
      expectedLanguage: defaultLanguage,
      expectedScheme: "auto",
      language: defaultLanguage,
      theme: "system",
    },
    {
      expectedLanguage: "tr-TR",
      expectedScheme: "dark",
      language: "tr-TR",
      theme: "dark",
    },
    {
      expectedLanguage: defaultLanguage,
      expectedScheme: "auto",
      language: "unsupported",
      theme: "system",
    },
  ] as const)(
    "loads language $language and applies theme $theme",
    async ({ expectedLanguage, expectedScheme, language, theme }) => {
      vi.spyOn(navigator, "languages", "get").mockReturnValue(["tr-TR"]);
      vi.mocked(Config).mockResolvedValue(new ConfigModel({ language, theme }));

      renderProvider();
      expect(appConfig.loading).toBe(true);

      await waitFor(() => expect(appConfig.loading).toBe(false));
      await waitFor(() => expect(i18n.language).toBe(expectedLanguage));

      expect(appConfig.config).toEqual({
        debugLogging: false,
        downloadUpdatesOnStartup: false,
        language: expectedLanguage,
        theme,
      });
      expect(document.documentElement.lang).toBe(expectedLanguage);
      expect(setColorScheme).toHaveBeenCalledOnce();
      expect(setColorScheme).toHaveBeenCalledWith(expectedScheme);
      expect(SetLanguage).not.toHaveBeenCalled();
    },
  );

  it("retries a failed configuration load", async () => {
    vi.mocked(Config)
      .mockRejectedValueOnce(new Error("config-load-failure"))
      .mockResolvedValueOnce(
        new ConfigModel({ language: defaultLanguage, theme: "dark" }),
      );

    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(appConfig.error).toBe("config-load-failure");

    act(() => appConfig.reload());

    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(Config).toHaveBeenCalledTimes(2);
    expect(appConfig.config).toEqual({
      debugLogging: false,
      downloadUpdatesOnStartup: false,
      language: defaultLanguage,
      theme: "dark",
    });
    expect(appConfig.error).toBeNull();
  });

  it.each([
    {
      setting: "theme",
      save: SetTheme,
      change: () => appConfig.setTheme("dark"),
      revert: () => appConfig.setTheme("system"),
      patch: { theme: "dark" },
      argument: "dark",
    },
    {
      setting: "language",
      save: SetLanguage,
      change: () => appConfig.setLanguage("tr-TR"),
      revert: () => appConfig.setLanguage(defaultLanguage),
      patch: { language: "tr-TR" },
      argument: "tr-TR",
    },
    {
      setting: "debug logging",
      save: SetDebugLogging,
      change: () => appConfig.setDebugLogging(true),
      revert: () => appConfig.setDebugLogging(false),
      patch: { debugLogging: true },
      argument: true,
    },
    {
      setting: "automatic updates",
      save: SetDownloadUpdatesOnStartup,
      change: () => appConfig.setDownloadUpdatesOnStartup(false),
      revert: () => appConfig.setDownloadUpdatesOnStartup(true),
      patch: { downloadUpdatesOnStartup: false },
      argument: false,
    },
  ])(
    "saves $setting and preserves it if the next save fails",
    async ({ save, change, revert, patch, argument }) => {
      renderProvider();
      await waitFor(() => expect(appConfig.loading).toBe(false));
      const initial = appConfig.config;

      await act(change);
      expect(save).toHaveBeenCalledWith(argument);
      expect(appConfig.config).toEqual({ ...initial, ...patch });
      expect(appConfig.error).toBeNull();
      if (patch.theme) expect(setColorScheme).toHaveBeenLastCalledWith("dark");
      if (patch.language) {
        expect(i18n.language).toBe("tr-TR");
        expect(document.documentElement.lang).toBe("tr-TR");
      }

      vi.mocked(save).mockRejectedValueOnce(new Error("write failed"));
      await act(revert);
      expect(appConfig.config).toEqual({ ...initial, ...patch });
      expect(appConfig.error).toBe("write failed");
    },
  );

  it("applies configuration events and unsubscribes on unmount", async () => {
    const { unmount } = renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));
    const [eventName, onChange] = vi.mocked(Events.On).mock.calls[0];
    const unsubscribe = vi.mocked(Events.On).mock.results[0].value;
    expect(eventName).toBe("config:changed");
    const saved = new ConfigModel({
      theme: "dark",
      language: "tr-TR",
      debugLogging: true,
      downloadUpdatesOnStartup: false,
    });

    act(() => onChange({ name: "config:changed", data: saved }));

    expect(appConfig.config).toEqual(saved);
    expect(setColorScheme).toHaveBeenLastCalledWith("dark");
    expect(i18n.language).toBe("tr-TR");
    expect(document.documentElement.lang).toBe("tr-TR");
    expect(SetTheme).not.toHaveBeenCalled();
    expect(SetLanguage).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

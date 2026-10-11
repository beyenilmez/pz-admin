import { StrictMode, type ReactNode } from "react";
import { act, render, waitFor } from "@/test/render";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Config as ConfigModel } from "@bindings/internal/config/models";
import {
  Config,
  SetLanguage,
  SetTheme,
  SetDownloadUpdatesOnStartup,
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
}));

let appConfig: ReturnType<typeof useAppConfig>;

function ConfigProbe() {
  appConfig = useAppConfig();
  return null;
}

function renderProvider(children: ReactNode = <ConfigProbe />) {
  return render(<AppConfigProvider>{children}</AppConfigProvider>);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  document.documentElement.lang = defaultLanguage;
});

describe("AppConfigProvider", () => {
  it("persists the update preference and preserves it after a failed save", async () => {
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({
        language: defaultLanguage,
        theme: "system",
        downloadUpdatesOnStartup: true,
      }),
    );
    vi.mocked(SetDownloadUpdatesOnStartup).mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));
    expect(appConfig.config?.downloadUpdatesOnStartup).toBe(true);
    await act(async () => appConfig.setDownloadUpdatesOnStartup(false));
    expect(SetDownloadUpdatesOnStartup).toHaveBeenCalledWith(false);
    expect(appConfig.config?.downloadUpdatesOnStartup).toBe(false);
    vi.mocked(SetDownloadUpdatesOnStartup).mockRejectedValue(
      new Error("write-failure"),
    );
    await act(async () => appConfig.setDownloadUpdatesOnStartup(true));
    expect(appConfig.config?.downloadUpdatesOnStartup).toBe(false);
    expect(appConfig.error).toBe("write-failure");
  });

  it("detects and saves the initial language once under StrictMode", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["tr"]);
    vi.mocked(Config)
      .mockResolvedValueOnce(new ConfigModel({ language: "", theme: "system" }))
      .mockResolvedValue(
        new ConfigModel({ language: "tr-TR", theme: "system" }),
      );
    vi.mocked(SetLanguage).mockResolvedValue(undefined);

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
    vi.mocked(SetLanguage).mockResolvedValue(undefined);
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

  it("exposes a configuration load failure", async () => {
    vi.mocked(Config).mockRejectedValue(new Error("config-load-failure"));

    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));

    expect(appConfig.config).toBeNull();
    expect(appConfig.error).toBe("config-load-failure");
    expect(setColorScheme).not.toHaveBeenCalled();
  });

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
      downloadUpdatesOnStartup: false,
      language: defaultLanguage,
      theme: "dark",
    });
    expect(appConfig.error).toBeNull();
  });

  it("saves and applies language and theme changes", async () => {
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({ language: defaultLanguage, theme: "dark" }),
    );
    vi.mocked(SetLanguage).mockResolvedValue(undefined);
    vi.mocked(SetTheme).mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));

    await act(async () => {
      await appConfig.setLanguage("tr-TR");
    });
    await waitFor(() => expect(i18n.language).toBe("tr-TR"));

    expect(SetLanguage).toHaveBeenCalledOnce();
    expect(SetLanguage).toHaveBeenCalledWith("tr-TR");
    expect(appConfig.config).toEqual({
      language: "tr-TR",
      theme: "dark",
      downloadUpdatesOnStartup: false,
    });
    expect(document.documentElement.lang).toBe("tr-TR");

    await act(async () => {
      await appConfig.setTheme("system");
    });

    expect(SetTheme).toHaveBeenCalledOnce();
    expect(SetTheme).toHaveBeenCalledWith("system");
    expect(appConfig.config).toEqual({
      language: "tr-TR",
      theme: "system",
      downloadUpdatesOnStartup: false,
    });
    expect(setColorScheme).toHaveBeenLastCalledWith("auto");
    expect(appConfig.error).toBeNull();
  });

  it("preserves loaded settings and exposes failed writes", async () => {
    const initialConfig = {
      language: defaultLanguage,
      theme: "dark",
      downloadUpdatesOnStartup: false,
    } as const;
    vi.mocked(Config).mockResolvedValue(new ConfigModel(initialConfig));
    vi.mocked(SetLanguage).mockRejectedValue(
      new Error("language-write-failure"),
    );
    vi.mocked(SetTheme).mockRejectedValue(new Error("theme-write-failure"));
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));

    await act(async () => {
      await expect(appConfig.setLanguage("tr-TR")).resolves.toBeUndefined();
    });

    expect(appConfig.config).toEqual(initialConfig);
    expect(appConfig.error).toBe("language-write-failure");
    expect(document.documentElement.lang).toBe(defaultLanguage);
    expect(i18n.language).toBe(defaultLanguage);

    await act(async () => {
      await expect(appConfig.setTheme("light")).resolves.toBeUndefined();
    });

    expect(appConfig.config).toEqual(initialConfig);
    expect(appConfig.error).toBe("theme-write-failure");
    expect(setColorScheme).toHaveBeenCalledOnce();
    expect(setColorScheme).toHaveBeenCalledWith("dark");
  });
});

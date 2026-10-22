import { beforeEach, describe, expect, it, vi } from "vitest";
import { System } from "@wailsio/runtime";
import { Flatpak } from "@bindings/internal/diagnostics/service";
import { OpenWindow } from "@bindings/internal/logger/service";
import { Config, SetDebugLogging } from "@bindings/internal/config/service";
import { Config as ConfigModel } from "@bindings/internal/config/models";
import { AppConfigProvider } from "@/features/config/AppConfigProvider";
import { FlatpakInfo } from "@bindings/internal/diagnostics/models";
import i18n from "@/i18n";
import { fireEvent, render, screen } from "@/test/render";
import { DiagnosticsSection } from "@/features/settings/components/DiagnosticsSection";
import { formatDiagnostics } from "@/features/settings/lib/diagnostics";

vi.mock("@wailsio/runtime", () => ({
  System: { Environment: vi.fn() },
  Events: { On: vi.fn(() => () => {}) },
}));

vi.mock("@bindings/internal/diagnostics/service", () => ({ Flatpak: vi.fn() }));

vi.mock("@bindings/internal/logger/service", () => ({ OpenWindow: vi.fn() }));
vi.mock("@bindings/internal/config/service", () => ({
  Config: vi.fn(),
  SetDebugLogging: vi.fn(),
  SetLanguage: vi.fn(),
  SetTheme: vi.fn(),
  SetDownloadUpdatesOnStartup: vi.fn(),
}));

function renderDiagnostics() {
  return render(
    <AppConfigProvider>
      <DiagnosticsSection />
    </AppConfigProvider>,
  );
}

const environment: System.EnvironmentInfo = {
  OS: "linux",
  Arch: "arm64",
  Debug: false,
  OSInfo: { Name: "Example OS", Version: "1", ID: "example", Branding: "" },
  PlatformInfo: { wayland: true, "gtk4-runtime": "4.20.0" },
};

describe("DiagnosticsSection", () => {
  beforeEach(() => {
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({ theme: "system", language: "en-US" }),
    );
    vi.mocked(SetDebugLogging).mockReset();
    vi.mocked(OpenWindow).mockReset();
    vi.mocked(System.Environment).mockReset();
    vi.mocked(System.Environment).mockResolvedValue(environment);
    vi.mocked(Flatpak).mockReset();
    vi.mocked(Flatpak).mockResolvedValue(null);
  });

  it("formats environment data including false flags and sorted platform fields", () => {
    const report = formatDiagnostics(environment);
    expect(report).toContain("os: linux\narch: arm64\ndebug_build: false");
    expect(report).toContain("flatpak: false");
    expect(report).toContain(
      "os_details.name: Example OS\nos_details.version: 1",
    );
    expect(report).toContain(
      "platform.gtk4-runtime: 4.20.0\nplatform.wayland: true",
    );
    expect(
      formatDiagnostics({
        ...environment,
        OSInfo: null,
        PlatformInfo: null,
      }),
    ).not.toContain("os_details");
  });

  it("shows the report and enables copying after loading", async () => {
    renderDiagnostics();
    expect(
      await screen.findByText(/platform\.wayland: true/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: i18n.t("actions.copy", { ns: "common" }),
      }),
    ).toBeEnabled();
  });

  it("includes Flatpak details in the displayed report", async () => {
    vi.mocked(Flatpak).mockResolvedValue(
      new FlatpakInfo({
        appId: "com.bedirhanyenilmez.pzadmin",
        version: "1.18.2",
        branch: "master",
        runtime: "runtime/org.gnome.Platform/aarch64/51",
        appCommit: "app-hash",
        runtimeCommit: "runtime-hash",
      }),
    );
    renderDiagnostics();
    const report = await screen.findByText(/flatpak\.app_id:/);
    expect(report).toHaveTextContent("flatpak: true");
    expect(report).toHaveTextContent("flatpak.version: 1.18.2");
    expect(report).toHaveTextContent(
      "flatpak.runtime: runtime/org.gnome.Platform/aarch64/51",
    );
    expect(report).toHaveTextContent("flatpak.app_commit: app-hash");
    expect(report).toHaveTextContent("flatpak.runtime_commit: runtime-hash");
  });

  it("keeps debug logging off when saving fails", async () => {
    vi.mocked(SetDebugLogging).mockRejectedValue(new Error("disk full"));
    renderDiagnostics();
    const control = await screen.findByRole("switch", {
      name: i18n.t("logs.debug.label", { ns: "settings" }),
    });
    await vi.waitFor(() => expect(control).toBeEnabled());
    fireEvent.click(control);
    await vi.waitFor(() => expect(SetDebugLogging).toHaveBeenCalledWith(true));
    await vi.waitFor(() => expect(control).toBeEnabled());
    expect(control).not.toBeChecked();
  });

  it("allows retrying a failed environment request", async () => {
    vi.mocked(System.Environment).mockRejectedValueOnce(
      new Error("Unavailable"),
    );
    renderDiagnostics();
    expect(await screen.findByText("Unavailable")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.t("actions.retry", { ns: "common" }),
      }),
    );
    expect(
      await screen.findByText(/platform\.wayland: true/),
    ).toBeInTheDocument();
    expect(System.Environment).toHaveBeenCalledTimes(2);
  });
});

it("shows an error when the log window cannot be opened", async () => {
  vi.mocked(OpenWindow).mockRejectedValue(new Error("window failed"));
  renderDiagnostics();
  fireEvent.click(
    screen.getByRole("button", {
      name: i18n.t("logs.actions.open", { ns: "settings" }),
    }),
  );
  expect(await screen.findByText("window failed")).toBeInTheDocument();
});

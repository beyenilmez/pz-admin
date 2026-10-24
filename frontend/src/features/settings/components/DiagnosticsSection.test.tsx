import { beforeEach, describe, expect, it, vi } from "vitest";
import { Report } from "@bindings/internal/diagnostics/service";
import { OpenWindow } from "@bindings/internal/logger/service";
import { Config, SetDebugLogging } from "@bindings/internal/config/service";
import { Config as ConfigModel } from "@bindings/internal/config/models";
import { AppConfigProvider } from "@/features/config/AppConfigProvider";
import type { Report as DiagnosticReport } from "@bindings/internal/diagnostics/models";
import i18n from "@/i18n";
import { fireEvent, render, screen } from "@/test/render";
import { DiagnosticsSection } from "@/features/settings/components/DiagnosticsSection";
import { formatDiagnostics } from "@/features/settings/lib/diagnostics";

vi.mock("@wailsio/runtime", () => ({
  Events: { On: vi.fn(() => () => {}) },
}));

vi.mock("@bindings/internal/diagnostics/service", () => ({ Report: vi.fn() }));

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

const diagnostics: DiagnosticReport = {
  version: "2.0.1-backend",
  os: "linux",
  arch: "arm64",
  debug_build: false,
  "os_details.name": "Example OS",
  "os_details.version": "1",
  "platform.wayland": true,
  "platform.gtk4-runtime": "4.20.0",
};

describe("DiagnosticsSection", () => {
  beforeEach(() => {
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({ theme: "system", language: "en-US" }),
    );
    vi.mocked(SetDebugLogging).mockReset();
    vi.mocked(OpenWindow).mockReset();
    vi.mocked(Report).mockReset();
    vi.mocked(Report).mockResolvedValue(diagnostics);
  });

  it("formats all backend fields, including false flags and new platform details", () => {
    expect(
      formatDiagnostics({
        ...diagnostics,
        "platform.extra": { enabled: false },
      }),
    ).toBe(
      [
        "arch: arm64",
        "debug_build: false",
        "os: linux",
        "os_details.name: Example OS",
        "os_details.version: 1",
        'platform.extra: {"enabled":false}',
        "platform.gtk4-runtime: 4.20.0",
        "platform.wayland: true",
        "version: 2.0.1-backend",
      ].join("\n"),
    );
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
    vi.mocked(Report).mockResolvedValue({
      ...diagnostics,
      flatpak: true,
      "flatpak.app_id": "com.bedirhanyenilmez.pzadmin",
      "flatpak.version": "1.18.2",
      "flatpak.branch": "master",
      "flatpak.runtime": "runtime/org.gnome.Platform/aarch64/51",
      "flatpak.app_commit": "app-hash",
      "flatpak.runtime_commit": "runtime-hash",
    });
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
    vi.mocked(Report).mockRejectedValueOnce(new Error("Unavailable"));
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
    expect(Report).toHaveBeenCalledTimes(2);
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

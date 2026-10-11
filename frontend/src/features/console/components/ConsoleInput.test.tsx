import { render, screen, userEvent, waitFor } from "@/test/render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { ID as FeatureID } from "@bindings/internal/feature/models";
import { Player } from "@bindings/internal/player/models";
import { Profile } from "@bindings/internal/profile/models";
import { useAppConfig } from "@/features/config/AppConfigProvider";
import { usePlayers } from "@/features/players/PlayersProvider";
import { useSession } from "@/features/session/SessionProvider";
import { clearConsoleCommand } from "../lib/catalog";
import { ConsoleInput } from "./ConsoleInput";

vi.mock("@/features/config/AppConfigProvider", () => ({
  useAppConfig: vi.fn(),
}));

vi.mock("@/features/players/PlayersProvider", () => ({
  usePlayers: vi.fn(),
}));

vi.mock("@/features/session/SessionProvider", () => ({
  useSession: vi.fn(),
}));

const profile = new Profile({
  connectionType: ConnectionType.TypeRCON,
  host: "127.0.0.1",
  id: "example",
  name: "Example server",
  port: 27015,
  version: "42",
});

const player = new Player({
  firstSeenAt: new Date("2026-01-01T00:00:00Z"),
  id: "alice",
  lastKnownOfflineAt: new Date("2026-01-01T00:00:00Z"),
  lastSeenOnlineAt: new Date("2026-01-02T00:00:00Z"),
  username: "Alice Smith",
});

beforeEach(() => {
  vi.mocked(useAppConfig).mockReturnValue({
    config: {
      language: "en-US",
      theme: "system",
      downloadUpdatesOnStartup: true,
    },
    error: null,
    loading: false,
    reload: vi.fn(),
    setDownloadUpdatesOnStartup: vi.fn(async () => undefined),
    setLanguage: vi.fn(),
    setTheme: vi.fn(),
  });
  vi.mocked(usePlayers).mockReturnValue({
    error: null,
    loading: false,
    players: [player],
    refresh: vi.fn(),
  });
  vi.mocked(useSession).mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    features: new Set<FeatureID>(),
    initializationError: null,
    profile,
    retryInitialization: vi.fn(),
    state: "connected",
    supports: vi.fn(() => false),
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("ConsoleInput", () => {
  it("executes an exact suggestion on Enter instead of completing it", async () => {
    const user = userEvent.setup();
    const onExecute = vi.fn();
    render(<ConsoleInput executing={false} onExecute={onExecute} />);
    const input = screen.getByRole("textbox");

    await user.type(input, clearConsoleCommand);
    const exactOption = await screen.findByRole("option", {
      name: clearConsoleCommand,
    });
    await waitFor(() =>
      expect(exactOption).toHaveAttribute("aria-selected", "true"),
    );

    await user.keyboard("{Enter}");

    expect(onExecute).toHaveBeenCalledOnce();
    expect(onExecute).toHaveBeenCalledWith(clearConsoleCommand);
    expect(input).toHaveValue("");
  });

  it("does not submit an empty command or while execution is pending", async () => {
    const user = userEvent.setup();
    const onExecute = vi.fn();
    const view = render(
      <ConsoleInput executing={false} onExecute={onExecute} />,
    );
    const input = screen.getByRole("textbox");

    await user.type(input, "   {Enter}");
    expect(onExecute).not.toHaveBeenCalled();

    view.rerender(<ConsoleInput executing onExecute={onExecute} />);
    await user.clear(input);
    await user.type(input, "custom pending command{Enter}");

    expect(onExecute).not.toHaveBeenCalled();
    expect(input).toHaveValue("custom pending command");
  });

  it("preserves the draft and edits while navigating command history", async () => {
    const user = userEvent.setup();
    render(<ConsoleInput executing={false} onExecute={vi.fn()} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "first{Enter}second{Enter}draft");
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("second");

    await user.clear(input);
    await user.type(input, "second edited");
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("first");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("second edited");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("draft");
  });

  it("dismisses open suggestions with Escape", async () => {
    const user = userEvent.setup();
    render(<ConsoleInput executing={false} onExecute={vi.fn()} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "add");
    expect(await screen.findByRole("listbox")).toBeVisible();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(input).toHaveValue("add");
  });

  it("quotes a completion containing spaces when Tab applies it", async () => {
    const user = userEvent.setup();
    render(<ConsoleInput executing={false} onExecute={vi.fn()} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "additem Al");
    expect(
      await screen.findByRole("option", { name: player.username }),
    ).toBeVisible();

    await user.keyboard("{Tab}");

    expect(input).toHaveValue(`additem "${player.username}" `);
  });
});

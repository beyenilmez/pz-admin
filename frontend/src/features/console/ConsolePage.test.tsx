import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { ID as FeatureID } from "@bindings/internal/feature/models";
import { Profile } from "@bindings/internal/profile/models";
import { Execute } from "@bindings/internal/console/service";
import { useAppConfig } from "@/features/config/AppConfigProvider";
import { usePlayers } from "@/features/players/PlayersProvider";
import { useSession } from "@/features/session/SessionProvider";
import i18n from "@/i18n";
import { render, screen, userEvent, waitFor, within } from "@/test/render";
import { ConsolePage } from "./ConsolePage";

vi.mock("@bindings/internal/console/service", () => ({
  Execute: vi.fn(),
}));

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

async function submitExactCommand(
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  command: string,
  suggestion: string,
) {
  await user.type(input, command);
  const option = await screen.findByRole("option", { name: suggestion });
  await waitFor(() => expect(option).toHaveAttribute("aria-selected", "true"));
  await user.keyboard("{Enter}");
}

function entryForCommand(transcript: HTMLElement, command: string) {
  const entry = within(transcript).getByText(command).parentElement;
  if (!entry) throw new Error(`Missing transcript entry for ${command}`);
  return entry;
}

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
    players: [],
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

describe("ConsolePage", () => {
  it("clears the transcript locally with cls", async () => {
    const user = userEvent.setup();
    render(<ConsolePage />);
    const input = screen.getByRole("textbox");
    const transcript = screen.getByRole("log");

    await submitExactCommand(user, input, "help cls", "cls");
    expect(
      within(transcript).getByText(i18n.t("help.cls", { ns: "console" })),
    ).toBeVisible();

    await submitExactCommand(user, input, "cls", "cls");

    expect(
      within(transcript).queryByText(i18n.t("help.cls", { ns: "console" })),
    ).not.toBeInTheDocument();
    expect(
      within(transcript).getByText(
        i18n.t("introduction.welcome", { ns: "console" }),
      ),
    ).toBeVisible();
    expect(Execute).not.toHaveBeenCalled();
  });

  it("appends a successful backend command and result", async () => {
    const user = userEvent.setup();
    vi.mocked(Execute).mockResolvedValue("player result");
    render(<ConsolePage />);
    const input = screen.getByRole("textbox");
    const transcript = screen.getByRole("log");

    await submitExactCommand(user, input, "players", "players");

    expect(Execute).toHaveBeenCalledOnce();
    expect(Execute).toHaveBeenCalledWith("players");
    expect(
      await within(entryForCommand(transcript, "players")).findByText(
        "player result",
      ),
    ).toBeVisible();
  });

  it("shows a normalized backend error", async () => {
    const user = userEvent.setup();
    vi.mocked(Execute).mockRejectedValue(
      new Error("transport: retryable failure"),
    );
    render(<ConsolePage />);
    const input = screen.getByRole("textbox");
    const transcript = screen.getByRole("log");

    await submitExactCommand(user, input, "save", "save");

    const failedEntry = entryForCommand(transcript, "save");
    expect(
      await within(failedEntry).findByText("retryable failure"),
    ).toBeVisible();
    expect(
      within(transcript).queryByText("transport: retryable failure"),
    ).not.toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});

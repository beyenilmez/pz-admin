import { beforeEach, describe, expect, it, vi } from "vitest";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { Profile } from "@bindings/internal/profile/models";
import { StartRain, StopServer } from "@bindings/internal/serveraction/service";
import { usePlayers } from "@/features/players/PlayersProvider";
import { useSession } from "@/features/session/SessionProvider";
import i18n from "@/i18n";
import { render, screen, userEvent, waitFor, within } from "@/test/render";
import { ServerActionsPage } from "./ServerActionsPage";

vi.mock("@/features/players/PlayersProvider", () => ({
  usePlayers: vi.fn(),
}));

vi.mock("@/features/session/SessionProvider", () => ({
  useSession: vi.fn(),
}));

vi.mock("@bindings/internal/serveraction/service", async (importOriginal) => {
  const service =
    await importOriginal<
      typeof import("@bindings/internal/serveraction/service")
    >();
  return { ...service, StartRain: vi.fn(), StopServer: vi.fn() };
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(usePlayers).mockReturnValue({
    error: null,
    loading: false,
    players: [],
    refresh: vi.fn(async () => undefined),
  });
  vi.mocked(useSession).mockReturnValue({
    connect: vi.fn(async () => undefined),
    disconnect: vi.fn(async () => undefined),
    features: new Set(),
    initializationError: null,
    profile: new Profile({
      connectionType: ConnectionType.TypeRCON,
      host: "127.0.0.1",
      id: "example",
      name: "Example server",
      port: 27015,
      version: "42",
    }),
    retryInitialization: vi.fn(async () => undefined),
    state: "connected",
    supports: vi.fn(() => false),
  });
});

describe("ServerActionsPage", () => {
  it("starts rain with the entered numeric intensity and resets after success", async () => {
    const user = userEvent.setup();
    vi.mocked(StartRain).mockResolvedValue(undefined);
    render(<ServerActionsPage />);

    const intensity = screen.getByLabelText(
      i18n.t("fields.intensity.label", { ns: "serverActions" }),
    );
    const startRain = screen.getByRole("button", {
      name: i18n.t("actions.startRain", { ns: "serverActions" }),
    });
    expect(intensity).toHaveValue("");

    await user.type(intensity, "25");
    expect(intensity).toHaveValue("25");
    expect(StartRain).not.toHaveBeenCalled();

    await user.click(startRain);

    expect(StartRain).toHaveBeenCalledOnce();
    const [submittedIntensity] = vi.mocked(StartRain).mock.calls[0] ?? [];
    expect(submittedIntensity).toBe(25);
    expect(typeof submittedIntensity).toBe("number");
    await waitFor(() => expect(intensity).toHaveValue(""));
  });

  it("requires explicit confirmation and closes after stopping", async () => {
    const user = userEvent.setup();
    vi.mocked(StopServer).mockResolvedValue(undefined);
    render(<ServerActionsPage />);

    await user.click(
      screen.getByRole("button", {
        name: i18n.t("actions.stopServer", { ns: "serverActions" }),
      }),
    );

    const dialog = screen.getByRole("dialog");
    expect(StopServer).not.toHaveBeenCalled();

    const confirm = within(dialog).getByRole("button", {
      name: i18n.t("actions.stopServer", { ns: "serverActions" }),
    });
    await user.click(confirm);

    expect(StopServer).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});

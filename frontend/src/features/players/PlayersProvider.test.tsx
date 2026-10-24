import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CancellablePromise, Events } from "@wailsio/runtime";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import type { ID as FeatureID } from "@bindings/internal/feature/models";
import { Player, Update } from "@bindings/internal/player/models";
import { List } from "@bindings/internal/player/service";
import { Profile } from "@bindings/internal/profile/models";
import { useSession } from "@/features/session/SessionProvider";
import { PlayersProvider, usePlayers } from "./PlayersProvider";

vi.mock("@bindings/internal/player/service", () => ({ List: vi.fn() }));
vi.mock("@/features/session/SessionProvider", () => ({ useSession: vi.fn() }));

const firstProfile = new Profile({
  connectionType: ConnectionType.TypeRCON,
  host: "first.example.com",
  id: "first",
  name: "First server",
  port: 27015,
  version: "42",
});

const secondProfile = new Profile({
  connectionType: ConnectionType.TypeRCON,
  host: "second.example.com",
  id: "second",
  name: "Second server",
  port: 27016,
  version: "41",
});

const alpha = new Player({ id: "alpha", username: "Alpha" });
const beta = new Player({ id: "beta", username: "Beta" });

function sessionValue(
  profile: Profile | null,
  state: ReturnType<typeof useSession>["state"],
): ReturnType<typeof useSession> {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    features: new Set<FeatureID>(),
    initializationError: null,
    profile,
    retryInitialization: vi.fn(),
    state,
    supports: vi.fn(() => false),
  };
}

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  const promise = new CancellablePromise<Value>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function wrapper({ children }: PropsWithChildren) {
  return <PlayersProvider>{children}</PlayersProvider>;
}

let currentSession: ReturnType<typeof useSession>;
let emitPlayers: ((update: Update) => void) | undefined;

beforeEach(() => {
  currentSession = sessionValue(firstProfile, "connected");
  vi.mocked(useSession).mockImplementation(() => currentSession);
  emitPlayers = undefined;
  vi.mocked(Events.On).mockImplementation((eventName, callback) => {
    if (eventName === "players:changed") {
      emitPlayers = (update) => callback({ data: update, name: eventName });
    }
    return vi.fn();
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("PlayersProvider", () => {
  it("handles synchronous service errors on initial load and refresh", async () => {
    vi.mocked(List)
      .mockImplementationOnce(() => {
        throw new Error("bridge unavailable");
      })
      .mockImplementationOnce(() => {
        throw new Error("bridge still unavailable");
      })
      .mockResolvedValueOnce([alpha]);
    const { result } = renderHook(() => usePlayers(), { wrapper });

    await waitFor(() =>
      expect(result.current.error).toBe("bridge unavailable"),
    );
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await expect(result.current.refresh()).resolves.toBeUndefined();
    });
    expect(result.current.error).toBe("bridge still unavailable");
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current).toMatchObject({
      error: null,
      loading: false,
      players: [alpha],
    });
  });

  it("does not load players while disconnected", () => {
    currentSession = sessionValue(firstProfile, "disconnected");

    const { result } = renderHook(() => usePlayers(), { wrapper });

    expect(List).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      error: null,
      loading: false,
      players: [],
    });
  });

  it("exposes a load failure and recovers through manual refresh", async () => {
    vi.mocked(List)
      .mockRejectedValueOnce(new Error("player store unavailable"))
      .mockResolvedValueOnce([alpha]);
    const { result } = renderHook(() => usePlayers(), { wrapper });

    await waitFor(() =>
      expect(result.current.error).toBe("player store unavailable"),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(List).toHaveBeenCalledTimes(2);
    expect(List).toHaveBeenLastCalledWith(firstProfile.id);
    expect(result.current).toMatchObject({
      error: null,
      loading: false,
      players: [alpha],
    });
  });

  it("ignores foreign events and lets a matching event supersede an older list", async () => {
    const listRequest = deferred<Player[]>();
    vi.mocked(List).mockReturnValue(listRequest.promise);
    const { result } = renderHook(() => usePlayers(), { wrapper });
    await waitFor(() => expect(emitPlayers).toBeTypeOf("function"));

    act(() => {
      emitPlayers?.(
        new Update({ profileId: secondProfile.id, players: [beta] }),
      );
    });
    expect(result.current.players).toEqual([]);

    act(() => {
      emitPlayers?.(
        new Update({ profileId: firstProfile.id, players: [beta] }),
      );
    });
    expect(result.current.players).toEqual([beta]);

    await act(async () => {
      listRequest.resolve([alpha]);
      await listRequest.promise;
    });
    expect(result.current.players).toEqual([beta]);
  });

  it("clears a changed profile and ignores its stale request", async () => {
    const staleRequest = deferred<Player[]>();
    const nextRequest = deferred<Player[]>();
    vi.mocked(List)
      .mockResolvedValueOnce([alpha])
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);
    const { rerender, result } = renderHook(() => usePlayers(), { wrapper });
    await waitFor(() => expect(result.current.players).toEqual([alpha]));

    act(() => {
      void result.current.refresh();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    currentSession = sessionValue(secondProfile, "connected");
    rerender();
    await waitFor(() => expect(List).toHaveBeenCalledTimes(3));
    expect(List).toHaveBeenLastCalledWith(secondProfile.id);
    expect(result.current.players).toEqual([]);

    await act(async () => {
      staleRequest.resolve([alpha]);
      await staleRequest.promise;
    });
    expect(result.current.players).toEqual([]);

    await act(async () => {
      nextRequest.resolve([beta]);
      await nextRequest.promise;
    });
    expect(result.current.players).toEqual([beta]);
  });
});

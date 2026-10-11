import type { ReactNode } from "react";
import { act, render, waitFor } from "@/test/render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CancellablePromise, Events } from "@wailsio/runtime";
import { notifications } from "@mantine/notifications";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { ID as FeatureID } from "@bindings/internal/feature/models";
import { Profile } from "@bindings/internal/profile/models";
import { Snapshot } from "@bindings/internal/session/models";
import {
  Connect,
  Disconnect,
  Snapshot as LoadSnapshot,
} from "@bindings/internal/session/service";
import { SessionProvider, useSession } from "./SessionProvider";

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

vi.mock("@bindings/internal/session/service", () => ({
  Connect: vi.fn(),
  Disconnect: vi.fn(),
  Snapshot: vi.fn(),
}));

const profile = new Profile({
  connectionType: ConnectionType.TypeRCON,
  host: "127.0.0.1",
  id: "example",
  name: "Example server",
  port: 27015,
  version: "42",
});

const features = [FeatureID.ConsoleExecuteCommand, FeatureID.PlayerList];

function connectedSnapshot() {
  return new Snapshot({ connected: true, features, profile });
}

function disconnectedSnapshot() {
  return new Snapshot({ connected: false });
}

interface Deferred<Value> {
  promise: CancellablePromise<Value>;
  resolve: (value: Value) => void;
}

function deferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void;
  const promise = new CancellablePromise<Value>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

let session: ReturnType<typeof useSession>;
let sessionChanged: ((snapshot: Snapshot) => void) | undefined;
let unsubscribe: ReturnType<typeof vi.fn<() => void>>;

function SessionProbe() {
  session = useSession();
  return null;
}

function renderProvider(children: ReactNode = <SessionProbe />) {
  return render(<SessionProvider>{children}</SessionProvider>);
}

beforeEach(() => {
  sessionChanged = undefined;
  unsubscribe = vi.fn<() => void>();
  vi.mocked(Events.On).mockImplementation((eventName, callback) => {
    if (eventName === "session:changed") {
      sessionChanged = (snapshot) => {
        callback({ data: snapshot, name: eventName });
      };
    }
    return unsubscribe;
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("SessionProvider", () => {
  it("initializes from the current connected session", async () => {
    vi.mocked(LoadSnapshot).mockResolvedValue(connectedSnapshot());

    renderProvider();

    await waitFor(() => expect(session.state).toBe("connected"));
    expect(session.profile).toEqual(profile);
    expect(session.supports(FeatureID.ConsoleExecuteCommand)).toBe(true);
    expect(session.initializationError).toBeNull();
  });

  it("exposes an initialization failure and recovers when retried", async () => {
    vi.mocked(LoadSnapshot)
      .mockRejectedValueOnce(new Error("session unavailable"))
      .mockResolvedValueOnce(disconnectedSnapshot());

    renderProvider();

    await waitFor(() =>
      expect(session.initializationError).toBe("session unavailable"),
    );

    await act(async () => {
      await session.retryInitialization();
    });

    expect(session.state).toBe("disconnected");
    expect(session.initializationError).toBeNull();
    expect(LoadSnapshot).toHaveBeenCalledTimes(2);
  });

  it("does not let an older snapshot overwrite a newer session event", async () => {
    const snapshotRequest = deferred<Snapshot>();
    vi.mocked(LoadSnapshot).mockReturnValue(snapshotRequest.promise);
    renderProvider();
    await waitFor(() => expect(sessionChanged).toBeTypeOf("function"));

    act(() => {
      sessionChanged?.(connectedSnapshot());
    });
    await act(async () => {
      snapshotRequest.resolve(disconnectedSnapshot());
      await snapshotRequest.promise;
    });

    expect(session.state).toBe("connected");
    expect(session.profile).toEqual(profile);
  });

  it("propagates a connection failure and adopts the authoritative snapshot", async () => {
    const liveProfile = new Profile({
      connectionType: ConnectionType.TypeRCON,
      host: "live.example.com",
      id: "live",
      name: "Existing live server",
      port: 27016,
      version: "41",
    });
    const connectionError = new Error("connection refused");
    vi.mocked(LoadSnapshot)
      .mockResolvedValueOnce(disconnectedSnapshot())
      .mockResolvedValueOnce(
        new Snapshot({ connected: true, features, profile: liveProfile }),
      );
    vi.mocked(Connect).mockRejectedValue(connectionError);
    renderProvider();
    await waitFor(() => expect(session.state).toBe("disconnected"));

    await act(async () => {
      await expect(session.connect(profile)).rejects.toBe(connectionError);
    });

    expect(Connect).toHaveBeenCalledOnce();
    expect(Connect).toHaveBeenCalledWith("example");
    expect(LoadSnapshot).toHaveBeenCalledTimes(2);
    expect(session.state).toBe("connected");
    expect(session.profile).toEqual(liveProfile);
    expect(session.supports(FeatureID.PlayerList)).toBe(true);
  });

  it("notifies only when disconnection was not requested by the user", async () => {
    const disconnectRequest = deferred<void>();
    vi.mocked(LoadSnapshot).mockResolvedValue(connectedSnapshot());
    vi.mocked(Disconnect).mockReturnValue(disconnectRequest.promise);
    renderProvider();
    await waitFor(() => expect(session.state).toBe("connected"));

    act(() => {
      sessionChanged?.(disconnectedSnapshot());
    });
    expect(notifications.show).toHaveBeenCalledOnce();

    act(() => {
      sessionChanged?.(connectedSnapshot());
    });
    let disconnectPromise: Promise<void>;
    act(() => {
      disconnectPromise = session.disconnect();
    });
    act(() => {
      sessionChanged?.(disconnectedSnapshot());
    });
    expect(notifications.show).toHaveBeenCalledOnce();

    disconnectRequest.resolve();
    await act(async () => {
      await disconnectPromise;
    });
  });

  it("resynchronizes and rethrows when disconnecting fails", async () => {
    vi.mocked(LoadSnapshot)
      .mockResolvedValueOnce(connectedSnapshot())
      .mockResolvedValueOnce(connectedSnapshot());
    vi.mocked(Disconnect).mockRejectedValue(new Error("disconnect failed"));
    renderProvider();
    await waitFor(() => expect(session.state).toBe("connected"));

    await act(async () => {
      await expect(session.disconnect()).rejects.toThrow("disconnect failed");
    });

    expect(Disconnect).toHaveBeenCalledOnce();
    expect(LoadSnapshot).toHaveBeenCalledTimes(2);
    expect(session.state).toBe("connected");

    act(() => {
      sessionChanged?.(disconnectedSnapshot());
    });
    expect(notifications.show).toHaveBeenCalledOnce();
  });
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notifications } from "@mantine/notifications";
import { useServerAction } from "./useServerAction";

const { translate } = vi.hoisted(() => ({
  translate: vi.fn((key: string) => `translated:${key}`),
}));

vi.mock("react-i18next", () => ({
  useTranslation: (namespaces: string[]) => {
    if (
      namespaces.length !== 2 ||
      namespaces[0] !== "serverActions" ||
      namespaces[1] !== "common"
    ) {
      throw new Error("Expected the serverActions and common namespaces");
    }
    return { t: translate };
  },
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

interface Deferred<Value> {
  promise: Promise<Value>;
  reject: (reason?: unknown) => void;
  resolve: (value: Value) => void;
}

function deferred<Value>(): Deferred<Value> {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((nextResolve, nextReject) => {
    reject = nextReject;
    resolve = nextResolve;
  });
  return { promise, reject, resolve };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useServerAction", () => {
  it("runs one operation at a time and exposes its pending lifecycle", async () => {
    const request = deferred<void>();
    const operation = vi.fn(() => request.promise);
    const blockedOperation = vi.fn(async () => Promise.resolve());
    const { result } = renderHook(() => useServerAction());
    expect(result.current.pending).toBeNull();

    let firstRun!: Promise<boolean>;
    let blockedRun!: Promise<boolean>;
    act(() => {
      firstRun = result.current.run("save", operation, "success-message");
      blockedRun = result.current.run(
        "restart",
        blockedOperation,
        "blocked-message",
      );
    });

    expect(result.current.pending).toBe("save");
    expect(operation).toHaveBeenCalledOnce();
    expect(blockedOperation).not.toHaveBeenCalled();
    await expect(blockedRun).resolves.toBe(false);

    request.resolve();
    await act(async () => {
      await expect(firstRun).resolves.toBe(true);
    });

    expect(result.current.pending).toBeNull();
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      title: "translated:notifications.action.success.title",
      message: "success-message",
    });
  });

  it("derives a success message from the operation result", async () => {
    const successMessage = vi.fn((value: number) => `result:${value}`);
    const { result } = renderHook(() => useServerAction());

    let succeeded!: boolean;
    await act(async () => {
      succeeded = await result.current.run(
        "result-action",
        async () => Promise.resolve(42),
        successMessage,
      );
    });

    expect(succeeded).toBe(true);
    expect(successMessage).toHaveBeenCalledOnce();
    expect(successMessage).toHaveBeenCalledWith(42);
    expect(notifications.show).toHaveBeenCalledWith({
      title: "translated:notifications.action.success.title",
      message: "result:42",
    });
    expect(result.current.pending).toBeNull();
  });

  it("reports a thrown failure and clears the pending action", async () => {
    const request = deferred<void>();
    const operation = vi.fn(() => request.promise);
    const { result } = renderHook(() => useServerAction());

    let runRequest!: Promise<boolean>;
    act(() => {
      runRequest = result.current.run("failing-action", operation, "unused");
    });
    expect(result.current.pending).toBe("failing-action");

    request.reject(new Error("backend-failure"));
    await act(async () => {
      await expect(runRequest).resolves.toBe(false);
    });

    expect(result.current.pending).toBeNull();
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      color: "red",
      title: "translated:notifications.action.failure.title",
      message: "backend-failure",
    });
  });
});

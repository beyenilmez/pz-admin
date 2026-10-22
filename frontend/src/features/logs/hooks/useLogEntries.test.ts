import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CancellablePromise } from "@wailsio/runtime";
import { Read } from "@bindings/internal/logger/service";
import { Entry, Update } from "@bindings/internal/logger/models";
import { useLogEntries } from "./useLogEntries";

vi.mock("@bindings/internal/logger/service", () => ({ Read: vi.fn() }));
const update = (ids: number[], firstID = 1) =>
  new Update({
    entries: ids.map(
      (id) =>
        new Entry({ id, text: `entry ${id}`, level: id % 2 ? "INFO" : "WARN" }),
    ),
    firstID,
  });

beforeEach(() => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  vi.mocked(Read).mockReset();
});
afterEach(() => vi.useRealTimers());

it("appends only new entries, removes dropped entries and stops after unmount", async () => {
  vi.useFakeTimers();
  vi.mocked(Read)
    .mockResolvedValueOnce(update([1, 2]))
    .mockResolvedValueOnce(update([]))
    .mockResolvedValueOnce(update([3], 2));
  const { result, unmount } = renderHook(() => useLogEntries());
  await act(async () => {});
  const previous = result.current.entries;
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(result.current.entries).toBe(previous);
  expect(Read).toHaveBeenLastCalledWith(2);
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(result.current.entries.map((row) => row.id)).toEqual([2, 3]);
  unmount();
  await act(async () => vi.advanceTimersByTimeAsync(10000));
  expect(Read).toHaveBeenCalledTimes(3);
});

it("does not overlap slow reads or poll while hidden", async () => {
  vi.useFakeTimers();
  let finish!: (value: Update) => void;
  vi.mocked(Read).mockImplementationOnce(
    () =>
      new CancellablePromise<Update>((resolve) => {
        finish = resolve;
      }),
  );
  renderHook(() => useLogEntries());
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(Read).toHaveBeenCalledTimes(1);
  await act(async () => finish(update([1])));
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  expect(Read).toHaveBeenCalledTimes(1);
});

it("ignores a pending response after retrying the read", async () => {
  let finish!: (value: Update) => void;
  vi.mocked(Read)
    .mockImplementationOnce(
      () =>
        new CancellablePromise<Update>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(update([9]));
  const { result } = renderHook(() => useLogEntries());
  act(() => result.current.reload());
  await waitFor(() => expect(result.current.entries[0]?.id).toBe(9));
  await act(async () => finish(update([1])));
  expect(result.current.entries.map((row) => row.id)).toEqual([9]);
});

it("replaces entries when the entire previous batch has expired", async () => {
  vi.useFakeTimers();
  vi.mocked(Read)
    .mockResolvedValueOnce(update([1, 2]))
    .mockResolvedValueOnce(update([10001, 10002], 10001));
  const { result } = renderHook(() => useLogEntries());
  await act(async () => {});
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(Read).toHaveBeenCalledTimes(2);
  expect(Read).toHaveBeenLastCalledWith(2);
  expect(result.current.entries.map((entry) => entry.id)).toEqual([
    10001, 10002,
  ]);
});

it("retries a failed poll from the last received ID without losing records", async () => {
  vi.useFakeTimers();
  vi.mocked(Read)
    .mockResolvedValueOnce(update([1, 2]))
    .mockRejectedValueOnce(new Error("read failed"))
    .mockResolvedValueOnce(update([3]));
  const { result } = renderHook(() => useLogEntries());
  await act(async () => {});
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(result.current.error).toBe("read failed");
  expect(result.current.entries.map((entry) => entry.id)).toEqual([1, 2]);
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(Read).toHaveBeenLastCalledWith(2);
  expect(result.current.entries.map((entry) => entry.id)).toEqual([1, 2, 3]);
  expect(result.current.error).toBeNull();
});

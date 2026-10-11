import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePersistentNavigation } from "./usePersistentNavigation";

type Page = "console" | "players" | "settings";

describe("usePersistentNavigation", () => {
  it("keeps every visited page mounted while changing and revisiting pages", () => {
    const { result } = renderHook(() =>
      usePersistentNavigation<Page>("console"),
    );

    expect(result.current.activePage).toBe("console");
    expect(result.current.isVisited("console")).toBe(true);
    expect(result.current.isVisited("players")).toBe(false);
    expect(result.current.isVisited("settings")).toBe(false);

    act(() => result.current.changePage("players"));
    act(() => result.current.changePage("settings"));
    act(() => result.current.changePage("players"));

    expect(result.current.activePage).toBe("players");
    expect(
      (["console", "players", "settings"] satisfies Page[]).filter(
        result.current.isVisited,
      ),
    ).toEqual(["console", "players", "settings"]);
  });
});

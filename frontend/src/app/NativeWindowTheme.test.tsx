import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { NativeWindowTheme } from "./NativeWindowTheme";

const state = vi.hoisted(() => ({
  colorScheme: "light",
  setBackgroundColour: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@mantine/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mantine/core")>()),
  useComputedColorScheme: () => state.colorScheme,
}));

vi.mock("@wailsio/runtime", () => ({
  Window: { SetBackgroundColour: state.setBackgroundColour },
}));

afterEach(() => {
  document.body.style.removeProperty("background-color");
  state.colorScheme = "light";
  vi.clearAllMocks();
});

it("synchronizes the opaque native background when the color scheme changes", () => {
  document.body.style.backgroundColor = "rgb(255, 255, 255)";
  const { rerender } = render(<NativeWindowTheme />);
  expect(state.setBackgroundColour).toHaveBeenLastCalledWith(
    255,
    255,
    255,
    255,
  );

  state.colorScheme = "dark";
  document.body.style.backgroundColor = "rgb(36, 36, 36)";
  rerender(<NativeWindowTheme />);
  expect(state.setBackgroundColour).toHaveBeenLastCalledWith(36, 36, 36, 255);

  rerender(<NativeWindowTheme />);
  expect(state.setBackgroundColour).toHaveBeenCalledTimes(2);
});

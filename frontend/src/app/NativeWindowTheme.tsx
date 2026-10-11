import { useEffect } from "react";
import { toRgba, useComputedColorScheme } from "@mantine/core";
import { Window } from "@wailsio/runtime";

// Keep the WebView backing surface consistent with Mantine, including OS theme changes.
export function NativeWindowTheme() {
  const colorScheme = useComputedColorScheme("light");

  useEffect(() => {
    const { r, g, b } = toRgba(getComputedStyle(document.body).backgroundColor);
    void Window.SetBackgroundColour(r, g, b, 255);
  }, [colorScheme]);

  return null;
}

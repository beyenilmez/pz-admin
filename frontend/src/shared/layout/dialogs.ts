export const dialogSizes = {
  compact: "sm",
  standard: "md",
  wide: "lg",
  editor: "52rem",
  browser: "72rem",
} as const;

export const dialogBrowserViewportHeight =
  "min(62vh, 40rem, calc(100dvh - 14rem))";

export const dialogEditorViewport = {
  maxHeight: "min(22rem, calc(100dvh - 14rem))",
  minHeight: "min(18rem, calc(100dvh - 14rem))",
} as const;

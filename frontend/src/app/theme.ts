import { Badge, Modal, ScrollArea, createTheme } from "@mantine/core";

export function createAppTheme(closeButtonLabel: string) {
  return createTheme({
    components: {
      Badge: Badge.extend({ defaultProps: { tt: "none" } }),
      Modal: Modal.extend({
        defaultProps: {
          centered: true,
          closeButtonProps: { "aria-label": closeButtonLabel },
          scrollAreaComponent: ScrollArea.Autosize,
        },
      }),
    },
    fontFamily: '"Inter Variable", sans-serif',
    fontFamilyMonospace: '"JetBrains Mono Variable", monospace',
    headings: { fontFamily: '"Inter Variable", sans-serif' },
  });
}

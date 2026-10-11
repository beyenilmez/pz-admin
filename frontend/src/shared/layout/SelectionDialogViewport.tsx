import type { ReactNode } from "react";
import { Box } from "@mantine/core";
import { dialogBrowserViewportHeight } from "./dialogs";
import classes from "./SelectionDialogViewport.module.css";

interface SelectionDialogViewportProps {
  busy?: boolean;
  children: ReactNode;
}

export function SelectionDialogViewport({
  busy,
  children,
}: SelectionDialogViewportProps) {
  return (
    <Box
      aria-busy={busy}
      className={classes.root}
      h={dialogBrowserViewportHeight}
    >
      {children}
    </Box>
  );
}

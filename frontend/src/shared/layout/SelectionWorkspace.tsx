import type { ReactNode } from "react";
import { Box } from "@mantine/core";
import classes from "./SelectionWorkspace.module.css";

type SelectionWorkspaceLayout = "items" | "skills";

interface SelectionWorkspaceProps {
  children: ReactNode;
  layout: SelectionWorkspaceLayout;
}

export function SelectionWorkspace({
  children,
  layout,
}: SelectionWorkspaceProps) {
  return (
    <Box className={classes.container}>
      <Box className={classes.layout} data-layout={layout}>
        {children}
      </Box>
    </Box>
  );
}

import type { ReactNode } from "react";
import { Box, Tabs } from "@mantine/core";
import classes from "./SectionNavigation.module.css";

interface SectionNavigationItem<Value extends string> {
  icon?: ReactNode;
  label: string;
  value: Value;
}

interface SectionNavigationProps<Value extends string> {
  activePage: Value;
  children: ReactNode;
  footer?: ReactNode;
  items: SectionNavigationItem<Value>[];
  label: string;
  onPageChange: (page: Value) => void;
  sidebarWidth?: number;
}

interface SectionNavigationPanelProps {
  children: ReactNode;
  page: string;
  scrollable?: boolean;
}

export function SectionNavigation<Value extends string>({
  activePage,
  children,
  footer,
  items,
  label,
  onPageChange,
  sidebarWidth,
}: SectionNavigationProps<Value>) {
  return (
    <Tabs
      value={activePage}
      onChange={(page) => {
        const item = items.find((candidate) => candidate.value === page);
        if (item) onPageChange(item.value);
      }}
      orientation="vertical"
      keepMountedMode="display-none"
      classNames={classes}
      style={{ height: "100%", minHeight: 0 }}
    >
      <Box
        component="aside"
        className={classes.sidebar}
        style={{ flexBasis: sidebarWidth }}
      >
        <Tabs.List aria-label={label} className={classes.list}>
          {items.map((item) => (
            <Tabs.Tab
              key={item.value}
              value={item.value}
              leftSection={item.icon}
            >
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {footer ? <Box className={classes.footer}>{footer}</Box> : null}
      </Box>

      <Box style={{ flex: 1, minWidth: 0, minHeight: 0 }}>{children}</Box>
    </Tabs>
  );
}

export function SectionNavigationPanel({
  children,
  page,
  scrollable = true,
}: SectionNavigationPanelProps) {
  return (
    <Tabs.Panel
      value={page}
      h="100%"
      style={{
        minHeight: 0,
        overflowY: scrollable ? "auto" : "hidden",
      }}
    >
      {children}
    </Tabs.Panel>
  );
}

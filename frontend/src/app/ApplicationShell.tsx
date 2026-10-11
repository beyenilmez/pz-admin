import type { ReactNode } from "react";
import { Box, Tabs, Tooltip } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  PageContainer,
  type PageContentWidth,
} from "@/shared/layout/PageContainer";
import { isAppSection, type AppSection } from "./navigation";

interface ApplicationShellProps {
  activeSection: AppSection;
  children: ReactNode;
  onSectionChange: (section: AppSection) => void;
}

interface ApplicationShellPanelProps {
  children: ReactNode;
  fullHeight?: boolean;
  section: AppSection;
  width?: PageContentWidth;
}

export function ApplicationShellPanel({
  children,
  fullHeight = false,
  section,
  width = "standard",
}: ApplicationShellPanelProps) {
  if (fullHeight) {
    return (
      <Tabs.Panel
        value={section}
        style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        {children}
      </Tabs.Panel>
    );
  }

  return (
    <Tabs.Panel value={section} style={{ flex: 1 }}>
      <PageContainer contentWidth={width} py="xl">
        {children}
      </PageContainer>
    </Tabs.Panel>
  );
}

export function ApplicationShell({
  activeSection,
  children,
  onSectionChange,
}: ApplicationShellProps) {
  const { t } = useTranslation(["servers", "tools", "settings"]);

  return (
    <Tabs
      radius={0}
      keepMountedMode="display-none"
      value={activeSection}
      onChange={(section) => {
        if (section && isAppSection(section)) onSectionChange(section);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Tabs.List>
        <Tabs.Tab value="server">{t("page.title", { ns: "servers" })}</Tabs.Tab>
        <Tabs.Tab value="tools">{t("page.title", { ns: "tools" })}</Tabs.Tab>
        <Tooltip label={t("page.title", { ns: "settings" })}>
          <Tabs.Tab
            value="settings"
            aria-label={t("page.title", { ns: "settings" })}
            ml="auto"
          >
            <IconSettings size={16} aria-hidden="true" />
          </Tabs.Tab>
        </Tooltip>
      </Tabs.List>

      <Box
        component="main"
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Tabs>
  );
}

import type { ReactNode } from "react";
import { Group, Stack, Title } from "@mantine/core";
import type { GameBuild } from "../types";
import { PageContainer } from "@/shared/layout/PageContainer";
import { GameBuildSelector } from "./GameBuildSelector";
import classes from "./GameToolPageLayout.module.css";

interface GameToolPageLayoutProps {
  build: GameBuild;
  children: ReactNode;
  clipContent?: boolean;
  hidden?: boolean;
  onBuildChange: (build: GameBuild) => void;
  title: string;
}

export function GameToolPageLayout({
  build,
  children,
  clipContent = false,
  hidden = false,
  onBuildChange,
  title,
}: GameToolPageLayoutProps) {
  return (
    <PageContainer
      className={classes.root}
      contentWidth="wide"
      data-hidden={hidden || undefined}
      h="100%"
      py="md"
    >
      <Stack
        className={classes.content}
        data-clip-content={clipContent || undefined}
        gap="md"
      >
        <Group justify="space-between">
          <Title order={1}>{title}</Title>
          <GameBuildSelector onChange={onBuildChange} value={build} />
        </Group>
        {children}
      </Stack>
    </PageContainer>
  );
}

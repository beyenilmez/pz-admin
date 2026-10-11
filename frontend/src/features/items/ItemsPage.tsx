import { Alert, Box, Button, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ItemBrowser } from "@/features/items/components/ItemBrowser";
import type { GameBuild } from "@/features/game/types";
import { GameToolPageLayout } from "@/features/game/components/GameToolPageLayout";
import { GameCreditsButton } from "@/features/game/components/GameCreditsButton";
import { useItemCatalog } from "@/features/items/hooks/useItemCatalog";
import { useItemSelection } from "@/features/items/hooks/useItemSelection";

interface ItemsPageProps {
  build: GameBuild;
  onBuildChange: (build: GameBuild) => void;
}

export function ItemsPage({ build, onBuildChange }: ItemsPageProps) {
  const { i18n, t } = useTranslation(["items", "common"]);
  const language = i18n.language;
  const { catalog, error, loading, reload } = useItemCatalog(build, language);
  const selection = useItemSelection();

  return (
    <Box pos="relative" h="100%">
      <GameToolPageLayout
        build={build}
        clipContent
        onBuildChange={onBuildChange}
        title={t("page.title")}
      >
        {error ? (
          <Alert
            color="red"
            icon={<IconAlertCircle aria-hidden="true" size={20} />}
            title={t("errors.load.title")}
          >
            <Stack align="flex-start" gap="xs">
              {error}
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <ItemBrowser
          key={`${build}:${language}`}
          catalog={catalog}
          loading={loading}
          selection={selection}
        />
      </GameToolPageLayout>
      <GameCreditsButton />
    </Box>
  );
}

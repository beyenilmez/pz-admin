import { useState, type ReactNode } from "react";
import { IconCar, IconMessage, IconPackage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  SectionNavigation,
  SectionNavigationPanel,
} from "@/shared/layout/SectionNavigation";
import { ItemsPage } from "@/features/items/ItemsPage";
import { VehiclesPage } from "@/features/vehicles/VehiclesPage";
import { MessageEditorPage } from "@/features/messages/MessageEditorPage";
import { latestGameBuild, type GameBuild } from "@/features/game/types";
import { usePersistentNavigation } from "@/shared/hooks/usePersistentNavigation";

type ToolsPageName = "messages" | "items" | "vehicles";

export function ToolsPage() {
  const { t } = useTranslation("tools");
  const navigation = usePersistentNavigation<ToolsPageName>("messages");
  const [build, setBuild] = useState<GameBuild>(latestGameBuild);
  const navigationItems = [
    {
      value: "messages",
      label: t("page.title", { ns: "messages" }),
      icon: <IconMessage size={16} aria-hidden="true" />,
    },
    {
      value: "items",
      label: t("page.title", { ns: "items" }),
      icon: <IconPackage size={16} aria-hidden="true" />,
    },
    {
      value: "vehicles",
      label: t("page.title", { ns: "vehicles" }),
      icon: <IconCar size={16} aria-hidden="true" />,
    },
  ] satisfies Array<{
    icon: ReactNode;
    label: string;
    value: ToolsPageName;
  }>;

  return (
    <SectionNavigation
      activePage={navigation.activePage}
      items={navigationItems}
      label={t("navigation.label")}
      onPageChange={navigation.changePage}
    >
      <SectionNavigationPanel page="messages" scrollable={false}>
        <MessageEditorPage build={build} onBuildChange={setBuild} />
      </SectionNavigationPanel>

      <SectionNavigationPanel page="items" scrollable={false}>
        {navigation.isVisited("items") ? (
          <ItemsPage build={build} onBuildChange={setBuild} />
        ) : null}
      </SectionNavigationPanel>

      <SectionNavigationPanel page="vehicles" scrollable={false}>
        {navigation.isVisited("vehicles") ? (
          <VehiclesPage build={build} onBuildChange={setBuild} />
        ) : null}
      </SectionNavigationPanel>
    </SectionNavigation>
  );
}

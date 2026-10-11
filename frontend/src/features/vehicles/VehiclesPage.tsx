import { Alert, Box, Button, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { GameToolPageLayout } from "@/features/game/components/GameToolPageLayout";
import { GameCreditsButton } from "@/features/game/components/GameCreditsButton";
import { VehicleDetails } from "@/features/vehicles/components/details/VehicleDetails";
import { VehicleExplorer } from "@/features/vehicles/components/explorer/VehicleExplorer";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { useVehicleCatalog } from "@/features/vehicles/hooks/useVehicleCatalog";

interface VehiclesPageProps {
  build: GameBuild;
  onBuildChange: (build: GameBuild) => void;
}

export function VehiclesPage({ build, onBuildChange }: VehiclesPageProps) {
  const { t } = useTranslation(["vehicles", "common"]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCatalogEntry | null>(null);
  const { catalog, error, loading, reload } = useVehicleCatalog(build);
  const vehicleVariants = selectedVehicle
    ? (catalog?.variantsByVehicleId.get(selectedVehicle.id) ?? [])
    : [];

  useEffect(() => {
    setSelectedVehicle(null);
  }, [build]);

  function handleBack() {
    if (!selectedVehicle) return;
    const resultId = `vehicle-result-${selectedVehicle.id}`;
    setSelectedVehicle(null);
    requestAnimationFrame(() => document.getElementById(resultId)?.focus());
  }

  return (
    <Box pos="relative" h="100%">
      {selectedVehicle ? (
        <VehicleDetails
          onBack={handleBack}
          onVehicleChange={setSelectedVehicle}
          vehicle={selectedVehicle}
          variants={vehicleVariants}
        />
      ) : null}

      <GameToolPageLayout
        build={build}
        clipContent
        hidden={selectedVehicle !== null}
        onBuildChange={onBuildChange}
        title={t("page.title")}
      >
        {error ? (
          <Alert
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={t("errors.load.title")}
          >
            <Stack gap="xs" align="flex-start">
              {error}
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        {!error ? (
          <VehicleExplorer
            key={build}
            catalog={catalog}
            loading={loading}
            onVehicleSelect={setSelectedVehicle}
          />
        ) : null}
      </GameToolPageLayout>
      <GameCreditsButton />
    </Box>
  );
}

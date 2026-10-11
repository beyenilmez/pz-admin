import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { VehiclePicker } from "@/features/vehicles/components/picker/VehiclePicker";
import { GameCreditsScrollArea } from "@/features/game/components/GameCreditsScrollArea";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { useVehicleCatalog } from "@/features/vehicles/hooks/useVehicleCatalog";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import {
  dialogBrowserViewportHeight,
  dialogSizes,
} from "@/shared/layout/dialogs";

interface SpawnVehicleModalProps {
  build: GameBuild;
  onSpawn: (
    players: Player[],
    vehicle: VehicleCatalogEntry,
  ) => Promise<boolean>;
  onClose: () => void;
  opened: boolean;
  players: Player[];
}

export function SpawnVehicleModal({
  build,
  onSpawn,
  onClose,
  opened,
  players,
}: SpawnVehicleModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const { t: vehicleT } = useTranslation("vehicles");
  const { catalog, error, loading, reload } = useVehicleCatalog(build);
  const skeleton = useSkeletonVisibility(loading || !catalog);
  const [pickerRevision, setPickerRevision] = useState(0);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCatalogEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSpawn() {
    if (!selectedVehicle) return;
    setSubmitting(true);
    try {
      if (await onSpawn(players, selectedVehicle)) onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function resetPicker() {
    setSelectedVehicle(null);
    setPickerRevision((current) => current + 1);
  }

  return (
    <Modal
      scrollAreaComponent={GameCreditsScrollArea}
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      onClose={onClose}
      onExitTransitionEnd={resetPicker}
      opened={opened}
      size={dialogSizes.browser}
      title={t("dialogs.spawnVehicle.title")}
      withCloseButton={!submitting}
    >
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          {t("dialogs.spawnVehicle.description", {
            count: players.length,
            username: players[0]?.username,
          })}
        </Text>

        {error ? (
          <Alert
            aria-live="polite"
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={vehicleT("errors.load.title")}
          >
            <Stack align="flex-start" gap="xs">
              <Text size="sm">{error}</Text>
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : skeleton.active ? (
          <Stack gap="sm" h={dialogBrowserViewportHeight} aria-busy="true">
            {skeleton.visible ? (
              <>
                <Skeleton h={28} w="45%" />
                <Group align="stretch" grow>
                  <Skeleton h={150} />
                  <Skeleton h={150} />
                  <Skeleton h={150} />
                </Group>
              </>
            ) : null}
          </Stack>
        ) : catalog ? (
          <VehiclePicker
            key={pickerRevision}
            catalog={catalog}
            onChange={setSelectedVehicle}
            selectedVehicle={selectedVehicle}
          />
        ) : null}

        <Group justify="flex-end" pb="md">
          <Button disabled={submitting} onClick={onClose} variant="default">
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button
            disabled={!selectedVehicle}
            loading={submitting}
            onClick={() => void handleSpawn()}
          >
            {t("dialogs.spawnVehicle.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

import { useEffect, useRef } from "react";
import { Box, Text, UnstyledButton } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/PageContainer";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import classes from "./VehicleDetails.module.css";
import { VehicleOverview } from "./VehicleOverview";
import { VehicleVariants } from "./VehicleVariants";

interface VehicleDetailsProps {
  onBack: () => void;
  onVehicleChange: (vehicle: VehicleCatalogEntry) => void;
  vehicle: VehicleCatalogEntry;
  variants: VehicleCatalogEntry[];
}

export function VehicleDetails({
  onBack,
  onVehicleChange,
  vehicle,
  variants,
}: VehicleDetailsProps) {
  const { t } = useTranslation("vehicles");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const showVariants = variants.length > 1;

  useEffect(() => {
    titleRef.current?.focus();
  }, [vehicle.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        onBack();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <Box className={classes.root} h="100%">
      <Box className={classes.header} bg="var(--mantine-color-body)" pb="sm">
        <Box className={classes.headerBorder}>
          <PageContainer
            contentWidth={showVariants ? "wide" : "standard"}
            py="xs"
          >
            <UnstyledButton className={classes.backLink} onClick={onBack}>
              <IconArrowLeft size={16} aria-hidden="true" />
              <Text fw={500} size="sm">
                {t("details.actions.back")}
              </Text>
            </UnstyledButton>
          </PageContainer>
        </Box>
      </Box>

      <Box className={classes.content}>
        <PageContainer
          contentWidth={showVariants ? "wide" : "standard"}
          className={classes.contentContainer}
          h="100%"
          pb="sm"
        >
          <Box
            className={classes.panes}
            data-has-variants={showVariants || undefined}
          >
            <Box className={classes.pane}>
              <VehicleOverview titleRef={titleRef} vehicle={vehicle} />
            </Box>

            {showVariants ? (
              <Box className={classes.pane}>
                <VehicleVariants
                  onChange={onVehicleChange}
                  selectedVehicleId={vehicle.id}
                  variants={variants}
                />
              </Box>
            ) : null}
          </Box>
        </PageContainer>
      </Box>
    </Box>
  );
}

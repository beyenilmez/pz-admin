import {
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import classes from "./VehicleDetails.module.css";

interface VehicleVariantsProps {
  onChange: (vehicle: VehicleCatalogEntry) => void;
  selectedVehicleId: string;
  variants: VehicleCatalogEntry[];
}

export function VehicleVariants({
  onChange,
  selectedVehicleId,
  variants,
}: VehicleVariantsProps) {
  const { t } = useTranslation("vehicles");

  return (
    <Paper className={classes.scrollPanel} h="100%" p="md" withBorder>
      <Stack gap="sm">
        <Title order={2} size="h4">
          {t("variants.title")}
        </Title>
        <SimpleGrid
          cols={{ base: 1, "8rem": 2, "15rem": 3, "24rem": 4 }}
          spacing="xs"
          type="container"
        >
          {variants.map((variant) => {
            const label = variant.variant ?? variant.name;
            const selected = variant.id === selectedVehicleId;
            return (
              <Tooltip key={variant.id} label={label} withArrow>
                <UnstyledButton
                  aria-current={selected ? "true" : undefined}
                  aria-label={t("details.actions.openVariant", {
                    variant: label,
                  })}
                  className={classes.variant}
                  data-selected={selected || undefined}
                  onClick={() => {
                    if (!selected) onChange(variant);
                  }}
                >
                  {variant.image ? (
                    <Image
                      alt=""
                      fit="contain"
                      h={78}
                      loading="lazy"
                      src={variant.image}
                      style={{ transform: "translateX(4px) scale(1.34)" }}
                    />
                  ) : (
                    <IconCar
                      aria-hidden="true"
                      color="var(--mantine-color-dimmed)"
                      size={28}
                    />
                  )}
                </UnstyledButton>
              </Tooltip>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

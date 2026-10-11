import { useState } from "react";
import {
  ActionIcon,
  Breadcrumbs,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
} from "@/features/vehicles/types";
import { dialogBrowserViewportHeight } from "@/shared/layout/dialogs";
import { VehiclePickerCard } from "./VehiclePickerCard";
import { VehiclePickerSelection } from "./VehiclePickerSelection";
import {
  categoryImages,
  defaultVehicle,
  modelImages,
} from "../../lib/pickerCatalog";
import classes from "./VehiclePicker.module.css";

interface VehiclePickerProps {
  catalog: VehicleCatalog;
  onChange: (vehicle: VehicleCatalogEntry | null) => void;
  selectedVehicle: VehicleCatalogEntry | null;
}

export function VehiclePicker({
  catalog,
  onChange,
  selectedVehicle,
}: VehiclePickerProps) {
  const { t } = useTranslation("vehicles");
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null);
  const [modelIndex, setModelIndex] = useState<number | null>(null);
  const category =
    categoryIndex === null ? null : catalog.hierarchy[categoryIndex];
  const model =
    category && modelIndex !== null ? category.models[modelIndex] : null;

  function handleReset() {
    setCategoryIndex(null);
    setModelIndex(null);
    onChange(null);
  }

  function handleBack() {
    if (modelIndex !== null) {
      setModelIndex(null);
      onChange(null);
      return;
    }

    setCategoryIndex(null);
  }

  function handleModelSelect(nextModelIndex: number) {
    if (!category) return;
    const nextVehicle = defaultVehicle(
      catalog,
      category.models[nextModelIndex],
    );
    if (!nextVehicle) return;

    setModelIndex(nextModelIndex);
    onChange(nextVehicle);
  }

  const cards = category
    ? category.models.map((categoryModel, index) => ({
        id: categoryModel.id,
        images: modelImages(catalog, categoryModel).slice(0, 4),
        label: categoryModel.name,
        onClick: () => handleModelSelect(index),
      }))
    : catalog.hierarchy.map((catalogCategory, index) => ({
        id: catalogCategory.id,
        images: categoryImages(catalog, catalogCategory).slice(0, 4),
        label: catalogCategory.name,
        onClick: () => {
          setCategoryIndex(index);
          onChange(null);
        },
      }));

  return (
    <Stack className={classes.content} h={dialogBrowserViewportHeight}>
      <Group gap={6} wrap="nowrap">
        <ActionIcon
          aria-label={t("actions.back", { ns: "common" })}
          disabled={categoryIndex === null}
          onClick={handleBack}
          size="sm"
          variant="default"
        >
          <IconArrowLeft size={14} aria-hidden="true" />
        </ActionIcon>
        <Breadcrumbs
          separator={<IconChevronRight size={11} aria-hidden="true" />}
          separatorMargin={4}
        >
          {category ? (
            <UnstyledButton
              className={classes.breadcrumbLink}
              onClick={handleReset}
            >
              {t("picker.root")}
            </UnstyledButton>
          ) : (
            <Text fw={600} lh={1.2} size="sm">
              {t("picker.root")}
            </Text>
          )}
          {category ? (
            model ? (
              <UnstyledButton
                className={classes.breadcrumbLink}
                onClick={() => {
                  setModelIndex(null);
                  onChange(null);
                }}
              >
                {category.name}
              </UnstyledButton>
            ) : (
              <Text fw={600} lh={1.2} size="sm">
                {category.name}
              </Text>
            )
          ) : null}
          {model ? (
            <Text fw={600} lh={1.2} size="sm">
              {model.name}
            </Text>
          ) : null}
        </Breadcrumbs>
      </Group>

      {model && selectedVehicle ? (
        <VehiclePickerSelection
          onChange={onChange}
          selectedVehicle={selectedVehicle}
          variants={catalog.variantsByVehicleId.get(selectedVehicle.id) ?? []}
        />
      ) : (
        <ScrollArea
          h={0}
          offsetScrollbars
          overscrollBehavior="contain"
          style={{ flex: 1, minHeight: 0 }}
          type="auto"
        >
          <SimpleGrid
            cols={{ base: 2, "32rem": 3, "46rem": 4 }}
            p="xs"
            spacing="sm"
            type="container"
          >
            {cards.map((card) => (
              <VehiclePickerCard
                images={card.images}
                key={card.id}
                label={card.label}
                onClick={card.onClick}
              />
            ))}
          </SimpleGrid>
        </ScrollArea>
      )}
    </Stack>
  );
}

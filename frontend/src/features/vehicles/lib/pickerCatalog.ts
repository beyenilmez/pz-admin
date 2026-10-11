import type {
  VehicleCatalog,
  VehicleCatalogEntry,
  VehicleHierarchyCategory,
  VehicleHierarchyModel,
} from "@/features/vehicles/types";

export interface VehiclePickerImage {
  id: string;
  src: string;
}

export function defaultVehicle(
  catalog: VehicleCatalog,
  model: VehicleHierarchyModel,
): VehicleCatalogEntry | null {
  return catalog.vehiclesById.get(model.defaultVariantId) ?? null;
}

export function modelImages(
  catalog: VehicleCatalog,
  model: VehicleHierarchyModel,
): VehiclePickerImage[] {
  return model.variants.flatMap((variant) => {
    const image = catalog.vehiclesById.get(variant.id)?.image;
    return image ? [{ id: variant.id, src: image }] : [];
  });
}

export function categoryImages(
  catalog: VehicleCatalog,
  category: VehicleHierarchyCategory,
): VehiclePickerImage[] {
  return category.models.flatMap((model) => {
    const image = modelImages(catalog, model)[0];
    return image ? [image] : [];
  });
}

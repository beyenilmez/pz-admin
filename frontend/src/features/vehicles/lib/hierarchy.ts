export function vehicleCategoryValue(categoryId: string) {
  return `category:${categoryId}`;
}

export function vehicleModelValue(categoryId: string, modelId: string) {
  return `model:${categoryId}:${modelId}`;
}

export function permissionDescriptions(translations) {
  const description = translations.permissions?.localNetwork;
  if (description === undefined) return {};
  if (typeof description !== "string" || !description.trim())
    throw new Error("Invalid local-network permission description");
  return { NSLocalNetworkUsageDescription: description };
}

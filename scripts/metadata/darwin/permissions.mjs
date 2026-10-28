export function permissionDescriptions(translations) {
  const description = translations.permissions?.localNetwork;
  if (description === undefined) return {};
  if (typeof description !== "string" || !description.trim())
    throw new Error("Invalid local-network permission description");
  return { NSLocalNetworkUsageDescription: description };
}

// InfoPlist.strings uses quoted keys and values, not XML escaping.
// https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/LoadingResources/Strings/Strings.html
function quoteString(text) {
  return `"${text
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")}"`;
}

export function generatePermissionStrings(translations) {
  return Object.entries(permissionDescriptions(translations))
    .map(([key, text]) => `${quoteString(key)} = ${quoteString(text)};\n`)
    .join("");
}

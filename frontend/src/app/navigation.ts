const appSections = ["server", "tools", "settings"] as const;

export type AppSection = (typeof appSections)[number];

export function isAppSection(section: string): section is AppSection {
  return appSections.some((candidate) => candidate === section);
}

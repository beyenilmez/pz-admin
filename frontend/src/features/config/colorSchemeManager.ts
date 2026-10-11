import type { MantineColorSchemeManager } from "@mantine/core";

export const nonPersistentColorSchemeManager: MantineColorSchemeManager = {
  get: (defaultColorScheme) => defaultColorScheme,
  set: () => undefined,
  subscribe: () => undefined,
  unsubscribe: () => undefined,
  clear: () => undefined,
};

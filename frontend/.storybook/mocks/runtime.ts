import { fn } from "storybook/test";

// Resolve Wails' own declarations without a TypeScript path alias.
// Storybook maps this declaration entry to the pure converter implementation.
export * as Create from "../../node_modules/@wailsio/runtime/types/create.js";

export const Events = {
  On: (_name: string, _callback: unknown) => () => {},
};

export const Browser = {
  OpenURL: async (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  },
};

// Fail visibly if a new story reaches a service that has no explicit mock.
export const Call = {
  ByID: async (id: number) => {
    throw new Error(`Storybook has no mock for Wails method ${id}`);
  },
};

export const System = {
  IsWindows: fn(() => false),
  IsMac: fn(() => false),
  Environment: fn(async () => ({
    OS: "linux",
    Arch: "amd64",
    Debug: false,
    OSInfo: { Name: "Example Linux", Version: "1.0" },
    PlatformInfo: { DesktopEnvironment: "GNOME" },
  })),
};

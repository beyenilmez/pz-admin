import { vi } from "vitest";

// Vitest maps these declarations to Wails' implementations without desktop setup.
export * as Create from "../../node_modules/@wailsio/runtime/types/create.js";
export * from "../../node_modules/@wailsio/runtime/types/cancellable.js";

export const Events = {
  On: vi.fn(() => () => {}),
};

export const Browser = {
  OpenURL: vi.fn(),
};

export const System = {
  IsWindows: vi.fn(() => false),
  IsMac: vi.fn(() => false),
};

export const Call = {
  ByID: (id: number) => {
    throw new Error(`Unit test has no mock for Wails method ${id}`);
  },
};

export const Window = {
  SetTitle: vi.fn(async (_title: string) => {}),
};

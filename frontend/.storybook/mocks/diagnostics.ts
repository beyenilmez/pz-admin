import { fn } from "storybook/test";
import type { FlatpakInfo } from "@bindings/internal/diagnostics/models";

export const Flatpak = fn(async (): Promise<FlatpakInfo | null> => null);

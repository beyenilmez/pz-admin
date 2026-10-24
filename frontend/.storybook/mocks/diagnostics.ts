import { fn } from "storybook/test";
import type { Report as DiagnosticReport } from "@bindings/internal/diagnostics/models";

export const Report = fn(async (): Promise<DiagnosticReport> => ({
  version: APP_VERSION,
  os: "linux",
  arch: "amd64",
  debug_build: false,
  "os_details.name": "Example Linux",
  "os_details.version": "1.0",
  "platform.compositor": "gnome",
  "platform.wayland": true,
}));

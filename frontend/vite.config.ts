import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import wails from "@wailsio/runtime/plugins/vite";
import { defineConfig } from "vite";
import {
  frontendLicenseAssetName,
  frontendLicenseReport,
} from "./scripts/licenses/report.ts";

export default defineConfig({
  build: {
    license: { fileName: frontendLicenseAssetName },
  },
  define: {
    APP_VERSION: JSON.stringify(
      readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(),
    ),
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [react(), wails("./bindings"), frontendLicenseReport()],
});

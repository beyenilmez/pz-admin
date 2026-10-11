import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  frontendLicenseAssetName,
  frontendLicenseReport,
} from "./scripts/licenses/report.ts";

const path = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  root: path("./website"),
  base: "/pz-admin/",
  publicDir: path("./public"),
  build: {
    outDir: path("./dist-website"),
    emptyOutDir: true,
    license: { fileName: frontendLicenseAssetName },
  },
  define: {
    APP_VERSION: JSON.stringify(
      readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(),
    ),
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@wailsio/runtime": path("./src/website/runtime.ts"),
      "@": path("./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    fs: { allow: [path("../")] },
  },
  plugins: [react(), frontendLicenseReport("asset")],
});

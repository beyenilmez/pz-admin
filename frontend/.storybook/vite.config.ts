import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// This config keeps the application's Wails plugin out of the browser preview.
export default defineConfig({
  // Storybook copies public assets via staticDirs; Vite must not copy them again.
  publicDir: false,
  define: { APP_VERSION: JSON.stringify("0.0.0-storybook") },
  resolve: {
    alias: {
      // TypeScript reads Wails' declarations; the browser uses the pure converters.
      "../../node_modules/@wailsio/runtime/types/create.js": local(
        "../node_modules/@wailsio/runtime/dist/create.js",
      ),
      "@wailsio/runtime": local("./mocks/runtime.ts"),
      // Service overrides must precede the general bindings alias.
      "@bindings/internal/logger/service": local("./mocks/logger.ts"),
      "@bindings/internal/diagnostics/service": local("./mocks/diagnostics.ts"),
      "@bindings/internal/player/service": local("./mocks/players.ts"),
      "@bindings/internal/session/service": local("./mocks/session.ts"),
      "@bindings/internal/profile/service": local("./mocks/profiles.ts"),
      "@bindings/internal/options/service": local("./mocks/options.ts"),
      "@bindings/internal/console/service": local("./mocks/console.ts"),
      "@bindings/internal/config/service": local("./mocks/config.ts"),
      "@bindings/internal/serveraction/service": local(
        "./mocks/serverActions.ts",
      ),
      "@bindings/internal/notices/service": local("./mocks/notices.ts"),
      "@bindings": local("../bindings/github.com/beyenilmez/pz-admin"),
      "@": local("../src"),
    },
  },
});

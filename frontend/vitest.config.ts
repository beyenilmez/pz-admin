import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "unit",
          alias: {
            "../../node_modules/@wailsio/runtime/types/create.js":
              fileURLToPath(
                new URL(
                  "./node_modules/@wailsio/runtime/dist/create.js",
                  import.meta.url,
                ),
              ),
            "../../node_modules/@wailsio/runtime/types/cancellable.js":
              fileURLToPath(
                new URL(
                  "./node_modules/@wailsio/runtime/dist/cancellable.js",
                  import.meta.url,
                ),
              ),
          },
          sequence: { groupOrder: 0 },
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          clearMocks: true,
        },
      },
      {
        extends: "./.storybook/vite.config.ts",
        plugins: [
          storybookTest({
            configDir: fileURLToPath(new URL("./.storybook", import.meta.url)),
          }),
        ],
        test: {
          name: "storybook",
          sequence: { groupOrder: 1 },
          maxWorkers: 2,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.d.ts", "src/**/*.stories.tsx"],
    },
  },
});

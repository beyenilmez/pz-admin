import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../{src,.storybook/stories}/**/*.stories.tsx"],
  addons: ["@storybook/addon-vitest"],
  staticDirs: ["../public"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: fileURLToPath(
          new URL("./vite.config.ts", import.meta.url),
        ),
      },
    },
  },
  core: { disableTelemetry: true },
};
export default config;

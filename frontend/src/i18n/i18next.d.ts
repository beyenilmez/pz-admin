import "i18next";
import type { defaultResources } from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof defaultResources;
  }
}

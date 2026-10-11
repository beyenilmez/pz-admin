import path from "node:path";
import { fileURLToPath } from "node:url";

export const frontendRoot = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
);

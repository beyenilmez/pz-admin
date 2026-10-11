import { fn } from "storybook/test";
import { ID } from "@bindings/internal/feature/models";
import { Profile } from "@bindings/internal/profile/models";
import { Type } from "@bindings/internal/connection/models";

export const Snapshot = fn(async () => {
  return {
    connected: true,
    features: Object.values(ID).filter(Boolean),
    profile: new Profile({
      id: "storybook-server",
      name: "Riverside Community",
      host: "pz.example.com",
      port: 27015,
      connectionType: Type.TypeRCON,
      version: "42",
    }),
  };
}).mockName("Session.Snapshot");

export async function Connect() {
  throw new Error("Server connections are unavailable in Storybook.");
}
export async function Disconnect() {
  throw new Error("Server connections are unavailable in Storybook.");
}

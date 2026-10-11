import { fn } from "storybook/test";
import { Profile } from "@bindings/internal/profile/models";
import { Type } from "@bindings/internal/connection/models";

export function makeProfiles() {
  return [
    new Profile({
      id: "storybook-server",
      name: "Riverside Community",
      host: "pz.example.com",
      port: 27015,
      connectionType: Type.TypeRCON,
      version: "42",
    }),
    new Profile({
      id: "storybook-legacy",
      name: "Rosewood Survival",
      host: "survival.example.com",
      port: 27015,
      connectionType: Type.TypeRCON,
      version: "41",
    }),
  ];
}
export const List = fn(async () => makeProfiles()).mockName("Profiles.List");
export const Save = fn(async (profile: Profile, _password: string) => {
  const saved = new Profile(profile);
  saved.id ||= "storybook-new";
  return saved;
}).mockName("Profiles.Save");
export const Delete = fn(async (_id: string) => {}).mockName("Profiles.Delete");

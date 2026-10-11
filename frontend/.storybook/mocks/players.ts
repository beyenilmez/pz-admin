import type { ActionResult } from "@bindings/internal/player/models";
import { fn } from "storybook/test";
import { makePlayers } from "./fixtures";

export const List = fn(async () => makePlayers()).mockName("List");

// Operations are deliberately unimplemented in this initial browsing setup.
// A story can override an individual mock when it needs a submission outcome.
const operation = (name: string) =>
  fn(async (..._args: unknown[]): Promise<ActionResult> => {
    throw new Error(`${name} is not configured in this Storybook story.`);
  }).mockName(name);

export const AddItems = operation("AddItems");
export const AddLocalUser = operation("AddLocalUser");
export const AddUser = operation("AddUser");
export const AddVehicle = operation("AddVehicle");
export const AddXP = operation("AddXP");
export const Ban = operation("Ban");
export const CreateHorde = operation("CreateHorde");
export const Kick = operation("Kick");
export const Lightning = operation("Lightning");
export const RemoveFromWhitelist = operation("RemoveFromWhitelist");
export const SetAccessLevel = operation("SetAccessLevel");
export const SetGodMode = operation("SetGodMode");
export const SetInvisible = operation("SetInvisible");
export const SetNoClip = operation("SetNoClip");
export const SetPassword = operation("SetPassword");
export const SetVoiceBanned = operation("SetVoiceBanned");
export const Teleport = operation("Teleport");
export const TeleportToCoordinates = operation("TeleportToCoordinates");
export const Thunder = operation("Thunder");
export const Unban = operation("Unban");

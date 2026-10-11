import { AddLocalUser, AddUser } from "@bindings/internal/player/service";
import { executePlayerOperation } from "../actionNotifications";

export function addServerUser(username: string, password: string) {
  return executePlayerOperation({
    execute: () => AddUser(username, password),
    successKey: "notifications.addServerUser.success",
    successValues: { username },
  });
}

export function addLocalPlayer(username: string) {
  return executePlayerOperation({
    execute: () => AddLocalUser(username),
    successKey: "notifications.addLocalPlayer.success",
    successValues: { username },
  });
}

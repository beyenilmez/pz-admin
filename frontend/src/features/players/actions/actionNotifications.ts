import type { ActionResult, Player } from "@bindings/internal/player/models";
import { notifications } from "@mantine/notifications";
import type { ParseKeys } from "i18next";
import i18n from "@/i18n";
import { errorMessage } from "@/shared/lib/errors";

const t = i18n.getFixedT(null, "players");

type PlayerSuccessMessageKey = Extract<
  ParseKeys<"players">,
  `notifications.${string}.success`
>;

interface ExecutePlayerActionOptions {
  execute: (playerIds: string[]) => PromiseLike<ActionResult>;
  successKey: PlayerSuccessMessageKey;
  successValues?: Record<string, unknown>;
  targets: Player[];
}

interface ExecutePlayerOperationOptions {
  execute: () => PromiseLike<void>;
  successKey: PlayerSuccessMessageKey;
  successValues?: Record<string, unknown>;
}

function showFailure(error: unknown) {
  notifications.show({
    color: "red",
    title: i18n.t("notifications.action.failure.title", { ns: "common" }),
    message: t("notifications.failure.message", {
      error: errorMessage(error),
    }),
  });
}

export async function executePlayerOperation({
  execute,
  successKey,
  successValues,
}: ExecutePlayerOperationOptions) {
  try {
    await execute();
    notifications.show({
      title: i18n.t("notifications.action.success.title", { ns: "common" }),
      message: t(successKey, successValues),
    });
    return true;
  } catch (operationError) {
    showFailure(operationError);
    return false;
  }
}

export async function executePlayerAction({
  execute,
  successKey,
  successValues,
  targets,
}: ExecutePlayerActionOptions) {
  try {
    const result = await execute(targets.map((player) => player.id));
    if (result.failed.length > 0) {
      const firstError = errorMessage(result.failed[0].message);
      if (result.succeeded.length === 0) {
        showFailure(firstError);
      } else {
        notifications.show({
          color: "yellow",
          title: t("notifications.partialFailure.title"),
          message: t("notifications.partialFailure.message", {
            error: firstError,
            failedCount: result.failed.length,
            succeededCount: result.succeeded.length,
            totalCount: targets.length,
          }),
        });
      }
      return false;
    }

    notifications.show({
      title: i18n.t("notifications.action.success.title", { ns: "common" }),
      message: t(successKey, {
        count: targets.length,
        username: targets[0]?.username,
        ...successValues,
      }),
    });
    return true;
  } catch (actionError) {
    showFailure(actionError);
    return false;
  }
}

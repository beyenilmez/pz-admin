import { useCallback, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { errorMessage } from "@/shared/lib/errors";

type SuccessMessage<Result> = string | ((result: Result) => string);

export function useServerAction() {
  const { t } = useTranslation(["serverActions", "common"]);
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const run = useCallback(
    async <Result>(
      id: string,
      operation: () => Promise<Result>,
      successMessage: SuccessMessage<Result>,
    ) => {
      if (pendingRef.current) return false;

      pendingRef.current = true;
      setPending(id);
      try {
        const result = await operation();
        notifications.show({
          title: t("notifications.action.success.title", { ns: "common" }),
          message:
            typeof successMessage === "function"
              ? successMessage(result)
              : successMessage,
        });
        return true;
      } catch (actionError) {
        notifications.show({
          color: "red",
          title: t("notifications.action.failure.title", { ns: "common" }),
          message: errorMessage(actionError),
        });
        return false;
      } finally {
        pendingRef.current = false;
        setPending(null);
      }
    },
    [t],
  );

  return { pending, run };
}

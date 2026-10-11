import i18n from "@/i18n";

function rawErrorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message.trim() || null;
  if (typeof error === "string") return error.trim() || null;
  return null;
}

/** Keeps meaningful operation details and falls back for opaque thrown values. */
export function errorMessage(error: unknown): string {
  return (
    rawErrorMessage(error) ?? i18n.t("errors.unexpected", { ns: "common" })
  );
}

/** Removes internal wrapper context from server-console command responses. */
export function rootErrorMessage(error: unknown): string {
  const message = rawErrorMessage(error) ?? String(error);
  const separator = message.lastIndexOf(": ");
  return separator === -1 ? message : message.slice(separator + 2);
}

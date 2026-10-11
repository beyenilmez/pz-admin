import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { errorMessage, rootErrorMessage } from "./errors";

class BindingError extends Error {}

describe("error messages", () => {
  it.each([
    [
      new BindingError("profile: store unavailable"),
      "profile: store unavailable",
    ],
    [
      new TypeError("Failed to fetch dynamically imported module"),
      "Failed to fetch dynamically imported module",
    ],
    [new Error("Unsupported theme: sepia"), "Unsupported theme: sepia"],
    ["kick: permission denied", "kick: permission denied"],
  ])("preserves details from proven error producer %#", (error, expected) => {
    expect(errorMessage(error)).toBe(expected);
  });

  it("uses localized fallback text for opaque thrown values", () => {
    const fallback = i18n.t("errors.unexpected", { ns: "common" });

    expect(errorMessage({ message: "unverified object shape" })).toBe(fallback);
    expect(errorMessage("   ")).toBe(fallback);
  });

  it("keeps trimmed raw details for the diagnostic console", () => {
    expect(rootErrorMessage(new Error("rcon: command failed"))).toBe(
      "command failed",
    );
  });
});

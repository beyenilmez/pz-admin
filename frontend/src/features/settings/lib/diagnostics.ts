import type { Report } from "@bindings/internal/diagnostics/models";

export function formatDiagnostics(report: Report): string {
  const fields = Object.entries(report);
  fields.sort(([left], [right]) => left.localeCompare(right));
  return fields
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join("\n");
}

import type { System } from "@wailsio/runtime";
import type { FlatpakInfo } from "@bindings/internal/diagnostics/models";

type DiagnosticEnvironment = Omit<
  System.EnvironmentInfo,
  "OSInfo" | "PlatformInfo"
> & {
  OSInfo: System.OSInfo | null;
  PlatformInfo: Record<string, unknown> | null;
};

export function formatDiagnostics(
  info: DiagnosticEnvironment,
  flatpak: FlatpakInfo | null = null,
): string {
  const fields: Record<string, unknown> = {
    version: APP_VERSION,
    os: info.OS,
    arch: info.Arch,
    debug_build: info.Debug,
  };
  if (info.OSInfo) {
    fields["os_details.name"] = info.OSInfo.Name;
    fields["os_details.version"] = info.OSInfo.Version;
  }
  const platformEntries = Object.entries(info.PlatformInfo ?? {});
  // Sort a fresh array; toSorted is outside our ES2022 target.
  platformEntries.sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of platformEntries) {
    fields[`platform.${key}`] = value;
  }
  fields.flatpak = flatpak !== null;
  if (flatpak) {
    const flatpakFields = {
      app_id: flatpak.appId,
      version: flatpak.version,
      branch: flatpak.branch,
      runtime: flatpak.runtime,
      app_commit: flatpak.appCommit,
      runtime_commit: flatpak.runtimeCommit,
    };
    for (const [key, value] of Object.entries(flatpakFields)) {
      if (value) fields[`flatpak.${key}`] = value;
    }
  }
  return Object.entries(fields)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join("\n");
}

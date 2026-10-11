import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { Profile } from "@bindings/internal/profile/models";

export interface ServerFormValues {
  name: string;
  host: string;
  port: number | string;
  version: string;
  password: string;
}

export type ServerFormErrors = Partial<Record<keyof ServerFormValues, string>>;

export function createInitialServerFormValues(
  profile: Profile | null,
): ServerFormValues {
  return {
    name: profile?.name ?? "",
    host: profile?.host ?? "",
    port: profile?.port ?? 27015,
    version: profile?.version ?? "auto",
    password: "",
  };
}

export function createProfileFromFormValues(
  values: ServerFormValues,
  currentProfile: Profile | null,
) {
  return new Profile({
    id: currentProfile?.id ?? "",
    name: values.name.trim(),
    connectionType: ConnectionType.TypeRCON,
    host: values.host.trim(),
    port: typeof values.port === "number" ? values.port : Number(values.port),
    version: values.version,
  });
}

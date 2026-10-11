import type { ID as FeatureID } from "@bindings/internal/feature/models";
import type { Profile } from "@bindings/internal/profile/models";
import type { Snapshot } from "@bindings/internal/session/models";

export type SessionState =
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected";

interface SessionData {
  features: ReadonlySet<FeatureID>;
  initializationError: string | null;
  profile: Profile | null;
  state: SessionState;
}

const emptyFeatures: ReadonlySet<FeatureID> = new Set();

export const initialSessionData: SessionData = {
  features: emptyFeatures,
  initializationError: null,
  profile: null,
  state: "initializing",
};

type SessionAction =
  | { type: "initializing" }
  | { type: "connecting"; profile: Profile }
  | { type: "connected"; snapshot: Snapshot }
  | { type: "disconnecting" }
  | { type: "disconnected" }
  | { type: "failed"; error: string; clearProfile?: boolean };

function assertNever(action: never): never {
  throw new Error(`Unknown session action: ${String(action)}`);
}

export function sessionReducer(
  current: SessionData,
  action: SessionAction,
): SessionData {
  switch (action.type) {
    case "initializing":
      return {
        ...current,
        initializationError: null,
        state: "initializing",
      };
    case "connecting":
      return {
        features: emptyFeatures,
        initializationError: null,
        profile: action.profile,
        state: "connecting",
      };
    case "connected":
      return {
        features: new Set(action.snapshot.features),
        initializationError: null,
        profile: action.snapshot.profile,
        state: "connected",
      };
    case "disconnecting":
      return { ...current, state: "disconnecting" };
    case "disconnected":
      return { ...initialSessionData, state: "disconnected" };
    case "failed":
      return {
        features: emptyFeatures,
        initializationError: action.error,
        profile: action.clearProfile ? null : current.profile,
        state: "disconnected",
      };
    default:
      return assertNever(action);
  }
}

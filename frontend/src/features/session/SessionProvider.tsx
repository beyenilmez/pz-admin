import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { Events } from "@wailsio/runtime";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import type { ID as FeatureID } from "@bindings/internal/feature/models";
import type { Profile } from "@bindings/internal/profile/models";
import { Connect, Disconnect } from "@bindings/internal/session/service";
import type { Snapshot } from "@bindings/internal/session/models";
import { errorMessage } from "@/shared/lib/errors";
import { sessionSnapshot } from "./lib/sessionSnapshot";
import {
  initialSessionData,
  sessionReducer,
  type SessionState,
} from "./lib/sessionState";

interface SessionContextValue {
  connect: (profile: Profile) => Promise<void>;
  disconnect: () => Promise<void>;
  features: ReadonlySet<FeatureID>;
  initializationError: string | null;
  profile: Profile | null;
  retryInitialization: () => Promise<void>;
  state: SessionState;
  supports: (feature: FeatureID) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { t } = useTranslation("session");
  const [{ features, initializationError, profile, state }, dispatch] =
    useReducer(sessionReducer, initialSessionData);
  // Async snapshots must not overwrite a newer connection lifecycle event.
  const eventRevision = useRef(0);
  const disconnectRequested = useRef(false);

  const synchronize = useCallback(async () => {
    const revision = eventRevision.current;
    dispatch({ type: "initializing" });

    try {
      const currentSnapshot = await sessionSnapshot();
      if (eventRevision.current !== revision) return;

      if (currentSnapshot.connected) {
        dispatch({ type: "connected", snapshot: currentSnapshot });
      } else {
        dispatch({ type: "disconnected" });
      }
    } catch (loadError) {
      if (eventRevision.current !== revision) return;
      dispatch({ type: "failed", error: errorMessage(loadError) });
    }
  }, []);

  useEffect(() => {
    const markEvent = () => {
      eventRevision.current += 1;
    };

    const unsubscribeSessionChanged = Events.On(
      "session:changed",
      ({ data: snapshot }: { data: Snapshot }) => {
        markEvent();
        if (!snapshot.connected) {
          dispatch({ type: "disconnected" });
          if (!disconnectRequested.current) {
            notifications.show({
              color: "red",
              title: t("connectionLost.title"),
              message: t("connectionLost.message"),
            });
          }
          return;
        }

        dispatch({ type: "connected", snapshot });
      },
    );

    void synchronize();

    return () => {
      unsubscribeSessionChanged();
    };
  }, [synchronize, t]);

  const connect = useCallback(
    async (nextProfile: Profile) => {
      eventRevision.current += 1;
      dispatch({ type: "connecting", profile: nextProfile });

      try {
        await Connect(nextProfile.id);
      } catch (connectionError) {
        // Resynchronize instead of assuming disconnection. A failed connection
        // attempt may leave a live backend session, such as when one already exists.
        await synchronize();
        throw connectionError;
      }
    },
    [synchronize],
  );

  const disconnect = useCallback(async () => {
    eventRevision.current += 1;
    disconnectRequested.current = true;
    dispatch({ type: "disconnecting" });

    try {
      await Disconnect();
    } catch (disconnectError) {
      await synchronize();
      throw disconnectError;
    } finally {
      disconnectRequested.current = false;
    }
  }, [synchronize]);

  const supports = useCallback(
    (feature: FeatureID) => features.has(feature),
    [features],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      connect,
      disconnect,
      features,
      initializationError,
      profile,
      retryInitialization: synchronize,
      state,
      supports,
    }),
    [
      connect,
      disconnect,
      features,
      initializationError,
      profile,
      state,
      supports,
      synchronize,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}

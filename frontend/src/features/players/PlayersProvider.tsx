import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Events } from "@wailsio/runtime";
import { Player } from "@bindings/internal/player/models";
import { List } from "@bindings/internal/player/service";
import { errorMessage } from "@/shared/lib/errors";
import { useSession } from "@/features/session/SessionProvider";

interface PlayersContextValue {
  error: string | null;
  loading: boolean;
  players: Player[];
  refresh: () => Promise<void>;
}

interface PlayersProviderProps {
  children: ReactNode;
}

interface PlayersRequest {
  profileId: string;
  request: ReturnType<typeof List>;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);
let playersRequest: PlayersRequest | null = null;

function listPlayers(profileId: string) {
  if (playersRequest?.profileId === profileId) return playersRequest.request;

  const request = List(profileId);
  playersRequest = { profileId, request };

  const clearRequest = () => {
    if (playersRequest?.request === request) playersRequest = null;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}

export function PlayersProvider({ children }: PlayersProviderProps) {
  const { profile, state } = useSession();
  const profileId = state === "connected" ? (profile?.id ?? null) : null;
  const eventRevisionRef = useRef(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;

    const requestRevision = eventRevisionRef.current;
    setError(null);
    setLoading(true);

    try {
      const loadedPlayers = await listPlayers(profileId);
      // Backend events are authoritative over older in-flight snapshots.
      if (eventRevisionRef.current !== requestRevision) return;
      setPlayers(loadedPlayers);
    } catch (loadError) {
      if (eventRevisionRef.current === requestRevision) {
        setError(errorMessage(loadError));
      }
    } finally {
      if (eventRevisionRef.current === requestRevision) setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    return Events.On("players:changed", ({ data: update }) => {
      if (update.profileId !== profileId) return;

      eventRevisionRef.current += 1;
      setPlayers(update.players.map((player) => Player.createFrom(player)));
      setError(null);
      setLoading(false);
    });
  }, [profileId]);

  useEffect(() => {
    eventRevisionRef.current += 1;
    setPlayers([]);
    setError(null);
    setLoading(false);

    if (profileId) void refresh();
  }, [profileId, refresh]);

  const value = useMemo(
    () => ({ error, loading, players, refresh }),
    [error, loading, players, refresh],
  );

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error("usePlayers must be used within PlayersProvider");
  }
  return context;
}

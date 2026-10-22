import { useEffect, useState } from "react";
import { Read } from "@bindings/internal/logger/service";
import type { Entry } from "@bindings/internal/logger/models";
import { errorMessage } from "@/shared/lib/errors";

export function useLogEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let afterID = 0;
    setEntries([]);
    setLoading(true);
    setError(null);

    const poll = async () => {
      if (!document.hidden) {
        try {
          const next = await Read(afterID);
          if (active) {
            if (next.entries.length > 0) {
              // Drop expired records before appending new ones.
              setEntries((current) => [
                ...current.filter((entry) => entry.id >= next.firstID),
                ...next.entries,
              ]);
              afterID = next.entries[next.entries.length - 1].id;
            }
            setError(null);
          }
        } catch (cause) {
          if (active) setError(errorMessage(cause));
        } finally {
          if (active) setLoading(false);
        }
      }
      if (active) timer = setTimeout(() => void poll(), 1000);
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [attempt]);

  return {
    entries,
    loading,
    error,
    reload: () => setAttempt((value) => value + 1),
  };
}

import { useCallback, useEffect, useState } from "react";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import { errorMessage } from "@/shared/lib/errors";
import { loadItemCatalog } from "../catalog";
import type { ItemCatalog } from "../types";

interface ItemCatalogState {
  catalog: ItemCatalog | null;
  error: string | null;
  loading: boolean;
}

interface ItemCatalogResult extends ItemCatalogState {
  reload: () => void;
}

const initialState: ItemCatalogState = {
  catalog: null,
  error: null,
  loading: true,
};

export function useItemCatalog(
  build: GameBuild,
  language: string,
): ItemCatalogResult {
  const [request, setRequest] = useState({ build, language });
  const reload = useCallback(
    () => setRequest((current) => ({ ...current })),
    [],
  );

  // Keep each request in state so returning to an earlier build or language
  // starts a fresh load without exposing that request's previous result.
  if (request.build !== build || request.language !== language) {
    setRequest({ build, language });
  }

  const [settled, setSettled] = useState<{
    request: typeof request;
    state: ItemCatalogState;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const loadedCatalog = await loadItemCatalog(
          request.build,
          request.language,
        );
        if (active) {
          setSettled({
            request,
            state: { catalog: loadedCatalog, error: null, loading: false },
          });
        }
      } catch (loadError) {
        if (active) {
          setSettled({
            request,
            state: {
              catalog: null,
              error: errorMessage(loadError),
              loading: false,
            },
          });
        }
      }
    }

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [request]);

  const state = settled?.request === request ? settled.state : initialState;

  if (
    state.catalog &&
    (state.catalog.build !== build ||
      state.catalog.language !== canonicalLanguage(language))
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}

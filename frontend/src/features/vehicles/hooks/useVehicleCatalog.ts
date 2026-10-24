import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import { errorMessage } from "@/shared/lib/errors";
import { loadVehicleCatalog } from "../catalog";
import type { VehicleCatalog } from "../types";

interface VehicleCatalogState {
  catalog: VehicleCatalog | null;
  error: string | null;
  loading: boolean;
}

interface VehicleCatalogResult extends VehicleCatalogState {
  reload: () => void;
}

const initialState: VehicleCatalogState = {
  catalog: null,
  error: null,
  loading: true,
};

export function useVehicleCatalog(build: GameBuild): VehicleCatalogResult {
  const { i18n } = useTranslation();
  const language = canonicalLanguage(i18n.language);
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
    state: VehicleCatalogState;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const loadedCatalog = await loadVehicleCatalog(
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
    (state.catalog.build !== build || state.catalog.language !== language)
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}

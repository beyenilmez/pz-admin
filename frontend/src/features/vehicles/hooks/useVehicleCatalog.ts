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
  const [state, setState] = useState(initialState);
  const [reloadRevision, setReloadRevision] = useState(0);
  const reload = useCallback(
    () => setReloadRevision((revision) => revision + 1),
    [],
  );

  useEffect(() => {
    let active = true;
    setState(initialState);

    async function loadCatalog() {
      try {
        const loadedCatalog = await loadVehicleCatalog(build, language);
        if (active) {
          setState({ catalog: loadedCatalog, error: null, loading: false });
        }
      } catch (loadError) {
        if (active) {
          setState({
            catalog: null,
            error: errorMessage(loadError),
            loading: false,
          });
        }
      }
    }

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [build, language, reloadRevision]);

  if (
    state.catalog &&
    (state.catalog.build !== build || state.catalog.language !== language)
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}

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
        const loadedCatalog = await loadItemCatalog(build, language);
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
    (state.catalog.build !== build ||
      state.catalog.language !== canonicalLanguage(language))
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}

import { useCallback, useEffect, useState } from "react";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import { errorMessage } from "@/shared/lib/errors";
import { loadSkillCatalog } from "../catalog";
import type { SkillCatalog } from "../types";

interface SkillCatalogState {
  catalog: SkillCatalog | null;
  error: string | null;
  loading: boolean;
}

interface SkillCatalogResult extends SkillCatalogState {
  reload: () => void;
}

const initialState: SkillCatalogState = {
  catalog: null,
  error: null,
  loading: true,
};

export function useSkillCatalog(
  build: GameBuild,
  language: string,
): SkillCatalogResult {
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
        const loadedCatalog = await loadSkillCatalog(build, language);
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

  const languageTag = canonicalLanguage(language);
  if (
    state.catalog &&
    (state.catalog.build !== build || state.catalog.language !== languageTag)
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}

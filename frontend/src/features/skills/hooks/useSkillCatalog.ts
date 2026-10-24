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
    state: SkillCatalogState;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const loadedCatalog = await loadSkillCatalog(
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

  const languageTag = canonicalLanguage(language);
  if (
    state.catalog &&
    (state.catalog.build !== build || state.catalog.language !== languageTag)
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}

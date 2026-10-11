import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile } from "@bindings/internal/profile/models";
import { Delete, List, Save } from "@bindings/internal/profile/service";
import { errorMessage } from "@/shared/lib/errors";

let profileListRequest: ReturnType<typeof List> | null = null;

// React Strict Mode can mount effects twice in development. Share the active
// request so both mounts observe the same backend result.
function listProfiles() {
  if (profileListRequest) return profileListRequest;

  const request = List();
  profileListRequest = request;
  const clearRequest = () => {
    if (profileListRequest === request) profileListRequest = null;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}

export function useServerProfiles(language?: string) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setProfiles(await listProfiles());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => a.name.localeCompare(b.name, language)),
    [language, profiles],
  );

  async function saveProfile(profile: Profile, password: string) {
    setLoadError(null);
    // The modal handles save errors so it can remain open.
    const savedProfile = await Save(profile, password);
    setProfiles((current) => {
      const index = current.findIndex((item) => item.id === savedProfile.id);
      if (index === -1) return [...current, savedProfile];

      const next = [...current];
      next[index] = savedProfile;
      return next;
    });
  }

  async function removeProfile(profile: Profile) {
    setLoadError(null);
    // The confirmation modal handles delete errors.
    await Delete(profile.id);
    setProfiles((current) => current.filter((item) => item.id !== profile.id));
  }

  return {
    clearLoadError: () => setLoadError(null),
    load,
    loadError,
    loading,
    profiles: sortedProfiles,
    remove: removeProfile,
    save: saveProfile,
  };
}

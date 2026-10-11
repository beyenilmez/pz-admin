import { useState } from "react";
import type { Profile } from "@bindings/internal/profile/models";

interface ProfileDialogState {
  opened: boolean;
  profile: Profile | null;
}

const initialDialogState: ProfileDialogState = {
  opened: false,
  profile: null,
};

export function useProfileDialog() {
  const [dialog, setDialog] = useState(initialDialogState);

  return {
    ...dialog,
    close: () => setDialog((current) => ({ ...current, opened: false })),
    open: (profile: Profile | null) => setDialog({ opened: true, profile }),
  };
}

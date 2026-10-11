import { useEffect, useRef, useState } from "react";

const revealDelay = 25;
const minimumVisibleDuration = 125;

/** Prevents fast loads from flashing skeletons and brief skeletons from flickering. */
export function useSkeletonVisibility(loading: boolean) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (loading && !visible) {
      timeout = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, revealDelay);
    } else if (!loading && visible) {
      const elapsed = Date.now() - (shownAt.current ?? Date.now());
      timeout = setTimeout(
        () => {
          shownAt.current = null;
          setVisible(false);
        },
        Math.max(0, minimumVisibleDuration - elapsed),
      );
    }

    return () => clearTimeout(timeout);
  }, [loading, visible]);

  return {
    active: loading || visible,
    visible,
  };
}

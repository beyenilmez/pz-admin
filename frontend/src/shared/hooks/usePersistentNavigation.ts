import { useCallback, useRef, useState } from "react";

// Mounts a page on first visit, then preserves its local state across tabs.
export function usePersistentNavigation<Value extends string>(
  initialPage: Value,
) {
  const [activePage, setActivePage] = useState(initialPage);
  const visitedPages = useRef(new Set<Value>([initialPage]));

  const changePage = useCallback((page: Value) => {
    visitedPages.current.add(page);
    setActivePage(page);
  }, []);

  return {
    activePage,
    changePage,
    isVisited: (page: Value) => visitedPages.current.has(page),
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/apiErrors";
import { PAGE_SIZE } from "../utils/paging";

const SEARCH_DELAY_MS = 300;
const EMPTY_PAGE = { items: [], page: 0, size: PAGE_SIZE, total: 0, totalPages: 0 };

/**
 * A paginated, searchable list loaded from the backend (search and paging happen on the server).
 * const list = usePagedList((params) => listProjectMembers(projectId, params), [projectId]);
 * `params` is { q, page, size }. The list reloads when `deps`, the page or the search change.
 * Typing in the search waits SEARCH_DELAY_MS before asking the backend, and goes back to the first page.
 */
export function usePagedList(fetchPage, deps, { enabled = true, messages, size = PAGE_SIZE } = {}) {
  const [search, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: EMPTY_PAGE, error: "" });

  // always call the latest `fetchPage` and `messages`, without re-running the effect on every render
  const latest = useRef({ fetchPage, messages });
  useEffect(() => {
    latest.current = { fetchPage, messages };
  });

  // send the search only once the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const setSearch = useCallback((text) => {
    setSearchText(text);
    setPage(0);
  }, []);

  const key = enabled ? JSON.stringify([...deps, query, page, size, reloadCount]) : null;

  useEffect(() => {
    if (key === null) return;
    // drop the result if the inputs change (or the page closes) before it arrives
    let ignore = false;

    latest.current
      .fetchPage({ q: query, page, size })
      .then((data) => {
        if (ignore) return;
        // the page became empty (e.g. its last item was deleted): go to the last page that exists
        if (data.items.length === 0 && page > 0 && data.totalPages > 0) {
          setPage(data.totalPages - 1);
          return;
        }
        setResult({ key, data, error: "" });
      })
      .catch((err) => {
        if (!ignore) setResult({ key, data: EMPTY_PAGE, error: getErrorMessage(err, latest.current.messages) });
      });

    return () => {
      ignore = true;
    };
  }, [key, query, page, size]);

  // still loading until the result of the current request arrives
  const loading = key === null || result.key !== key;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const data = loading ? EMPTY_PAGE : result.data;

  return {
    items: data.items,
    total: data.total,
    totalPages: data.totalPages,
    size: data.size,
    page,
    setPage,
    search,
    setSearch,
    loading,
    error: loading ? "" : result.error,
    reload,
  };
}

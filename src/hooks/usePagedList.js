import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, isAbort } from "../utils/apiError";
import { EMPTY_PAGE } from "../utils/page";

const SEARCH_DELAY_MS = 300;

/**
 * A paginated, searchable list loaded from the backend (search and paging happen on the server).
 * const list = usePagedList((params, signal) => listProjectMembers(projectId, params, signal), [projectId]);
 * `params` is { page, size, q? } and the result a PageResponse. The list reloads when `deps`, the page or
 * the search change, aborting the previous request. Typing waits SEARCH_DELAY_MS and goes back to page 0.
 */
export const usePagedList = (fetchPage, deps, { enabled = true, fallback, messages, size = EMPTY_PAGE.size } = {}) => {
  const [search, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: EMPTY_PAGE, error: "" });

  // always call the latest `fetchPage` and texts, without re-running the effect on every render
  const latest = useRef({ fetchPage, fallback, messages });
  useEffect(() => {
    latest.current = { fetchPage, fallback, messages };
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
    if (key === null) return undefined;
    const controller = new AbortController();
    // a blank search is left out, so the backend returns the whole list
    const params = { page, size, ...(query && { q: query }) };

    latest.current
      .fetchPage(params, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        // the page became empty (e.g. its last item was removed): go to the last page that exists
        if (data.content.length === 0 && page > 0 && data.totalPages > 0) {
          setPage(data.totalPages - 1);
          return;
        }
        setResult({ key, data, error: "" });
      })
      .catch((err) => {
        if (isAbort(err) || controller.signal.aborted) return;
        const error = errorMessage(err, latest.current.fallback, latest.current.messages);
        setResult({ key, data: EMPTY_PAGE, error });
      });

    return () => controller.abort();
  }, [key, query, page, size]);

  // still loading until the result of the current request arrives
  const loading = key === null || result.key !== key;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const data = loading ? EMPTY_PAGE : result.data;

  return {
    items: data.content,
    total: data.totalElements,
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
};

import { useCallback, useEffect, useState } from "react";
import { listAllTasks } from "../api/tasksApi";
import { errorMessage, isAbort } from "../utils/apiError";
import { taskFilterParams } from "../utils/taskFilters";

// typing in the search waits this long before asking the backend; the other filters apply at once
const SEARCH_DELAY_MS = 300;

/**
 * Which tasks match the filter bar, asked from the backend (GET …/tasks with the filter params, tasks-docs.md §3.2).
 * const { matches, loading, error, reload } = useTaskFilterMatches(projectId, "board", filters);
 * `matches` is a Set of task ids, or null when no filter is set (show every task). While new filters load, the
 * previous matches stay, so the board doesn't flash every task or an empty board.
 * The Board and Backlog still load every task themselves: counts, sprint progress and drag maths use all of them.
 */
export const useTaskFilterMatches = (projectId, order, filters) => {
  const [search, setSearch] = useState(filters.q);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, matches: null, error: "" });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.q), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const params = taskFilterParams({ ...filters, q: search });
  const active = Object.keys(params).length > 0;
  const key = active ? JSON.stringify([projectId, order, params, reloadCount]) : null;

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();
    const [id, sort, query] = JSON.parse(key);

    listAllTasks(id, { order: sort, ...query }, controller.signal)
      .then((tasks) => {
        if (!controller.signal.aborted) setResult({ key, matches: new Set(tasks.map((task) => task.id)), error: "" });
      })
      .catch((err) => {
        if (isAbort(err) || controller.signal.aborted) return;
        setResult((prev) => ({ key, matches: prev.matches, error: errorMessage(err, "Couldn't apply the filters. Please try again.") }));
      });

    return () => controller.abort();
  }, [key]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const loading = active && result.key !== key;

  return {
    matches: active ? result.matches : null,
    loading,
    error: active && !loading ? result.error : "",
    reload,
  };
};

import { useCallback, useEffect, useRef, useState } from "react";
import { errorCode, errorMessage, isAbort } from "../utils/apiError";

/**
 * Loads one thing (a project, a workspace, ...) and tracks loading / error.
 * `load(signal)` is called again whenever a value in `deps` changes, or on reload();
 * the previous request is aborted, so a stale response never lands.
 * const { data, loading, error, errorCode, reload } = useAsync((signal) => getProject(id, signal), [id], { fallback });
 * Pass `enabled: false` to wait (e.g. until an id is known). `messages` are per-code texts for errorMessage.
 */
export const useAsync = (load, deps, { enabled = true, fallback, messages } = {}) => {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, depsKey: null, data: null, error: "", errorCode: null });

  // always call the latest `load` and texts, without re-running the effect on every render
  const latest = useRef({ load, fallback, messages });
  useEffect(() => {
    latest.current = { load, fallback, messages };
  });

  const depsKey = enabled ? JSON.stringify(deps) : null;
  const key = enabled ? JSON.stringify([...deps, reloadCount]) : null;

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();

    latest.current
      .load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, depsKey, data, error: "", errorCode: null });
      })
      .catch((err) => {
        if (isAbort(err) || controller.signal.aborted) return;
        const error = errorMessage(err, latest.current.fallback, latest.current.messages);
        setResult({ key, depsKey, data: null, error, errorCode: errorCode(err) });
      });

    return () => controller.abort();
  }, [key, depsKey]);

  // still loading until the result of the current request arrives
  const loading = key === null || result.key !== key;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    // during a reload() the previous data stays visible; when the inputs change it doesn't
    data: result.depsKey === depsKey ? result.data : null,
    loading,
    error: loading ? "" : result.error,
    errorCode: loading ? null : result.errorCode,
    reload,
  };
};

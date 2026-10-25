import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorCode, getErrorMessage } from "../utils/apiErrors";

/**
 * Loads one thing (a project, a workspace, ...) and tracks loading / error.
 * `load` is called again whenever a value in `deps` changes, or on reload().
 * const { data, loading, error, errorCode, reload } = useAsync(() => getProject(id), [id], { messages });
 * Pass `enabled: false` to wait (e.g. until an id is known).
 */
export function useAsync(load, deps, { enabled = true, messages } = {}) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "", errorCode: null });

  // always call the latest `load` and `messages`, without re-running the effect on every render
  const latest = useRef({ load, messages });
  useEffect(() => {
    latest.current = { load, messages };
  });

  const key = enabled ? JSON.stringify([...deps, reloadCount]) : null;

  useEffect(() => {
    if (key === null) return;
    // drop the result if the inputs change (or the page closes) before it arrives
    let ignore = false;

    latest.current
      .load()
      .then((data) => {
        if (!ignore) setResult({ key, data, error: "", errorCode: null });
      })
      .catch((err) => {
        if (!ignore) {
          const error = getErrorMessage(err, latest.current.messages);
          setResult({ key, data: null, error, errorCode: getErrorCode(err) });
        }
      });

    return () => {
      ignore = true;
    };
  }, [key]);

  // still loading until the result of the current request arrives
  const loading = key === null || result.key !== key;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    data: loading ? null : result.data,
    loading,
    error: loading ? "" : result.error,
    errorCode: loading ? null : result.errorCode,
    reload,
  };
}

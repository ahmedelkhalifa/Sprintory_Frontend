import { useCallback, useState } from "react";
import { getErrorMessage } from "../utils/apiErrors";

/**
 * Runs a change (create, archive, add people, ...) and tracks `submitting` and the error message to show.
 * const submit = useSubmit(messagesByCode);
 * const { ok, result, error } = await submit.run(() => archiveProject(id));
 * `error` is the raw error, so callers can read field errors from it (getFieldErrors).
 */
export function useSubmit(messages) {
  const [state, setState] = useState({ submitting: false, error: "" });

  const run = useCallback(
    async (action) => {
      setState({ submitting: true, error: "" });
      try {
        const result = await action();
        setState({ submitting: false, error: "" });
        return { ok: true, result };
      } catch (err) {
        setState({ submitting: false, error: getErrorMessage(err, messages) });
        return { ok: false, error: err };
      }
    },
    [messages],
  );

  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: "" })), []);

  return { ...state, run, clearError };
}

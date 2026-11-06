import { useState } from "react";
import { useSubmit } from "./useSubmit";
import { TASK_ERROR_MESSAGES } from "../constants/tasks";

/**
 * Saving a task page one field at a time (Jira-style), for both tasks and subtasks:
 * const fields = useFieldSave(task, { toValues: taskValues, validate: validateTask, toChanges: taskChanges,
 *   send: (changes) => updateTask(projectId, task.id, changes), onSaved: setTask });
 * `fields.save(patch)` checks the edited field(s) with `validate`, sends only what changed (`toChanges`) and hands
 * the saved task to `onSaved`. It answers { ok }, or { ok: false, invalid } while a field error shows (the
 * backend's VALIDATION_ERROR lands there too), or { ok: false, error, changes } for any other refusal, whose text
 * is in `fields.error`. `fields.send(changes)` sends changes as they are (e.g. again after a confirmation).
 */
export const useFieldSave = (task, { toValues, validate, toChanges, send, onSaved }) => {
  const [errors, setErrors] = useState({});
  const submit = useSubmit(TASK_ERROR_MESSAGES);

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const sendChanges = async (changes) => {
    const { ok, result, error } = await submit.run(() => send(changes));
    if (ok) onSaved(result);
    return { ok, error };
  };

  const save = async (patch) => {
    const fields = Object.keys(patch);
    const values = { ...toValues(task), ...patch };
    const found = validate(values);
    // only the edited fields' errors change; the others keep theirs
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(fields.map((field) => [field, found[field] ?? ""])) }));
    if (fields.some((field) => found[field])) return { ok: false, invalid: true };

    const changes = toChanges(task, values);
    if (Object.keys(changes).length === 0) return { ok: true };
    const { ok, error } = await sendChanges(changes);
    if (ok) return { ok: true };
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors((prev) => ({ ...prev, ...data.fieldErrors }));
      submit.clearError();
      return { ok: false, invalid: true };
    }
    return { ok: false, error, changes };
  };

  return {
    errors,
    clearFieldError,
    save,
    send: sendChanges,
    submitting: submit.submitting,
    error: submit.error,
    clearError: submit.clearError,
  };
};

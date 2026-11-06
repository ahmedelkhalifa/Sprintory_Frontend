import { useCallback, useMemo, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { restoreTask } from "../api/tasksApi";
import { TASK_ERROR_MESSAGES } from "../constants/tasks";
import { errorMessage } from "../utils/apiError";
import { UndoDeleteContext } from "./UndoDeleteContext";

const UNDO_MS = 8000;

// The "WR-12 deleted · Undo" snackbar after deleting a task or subtask (restoreTask). It sits above the pages, so it
// stays when the delete leaves the page (the task page goes back to the board). The backend keeps deleted tasks but
// has no list of them, so this is the only way back. Restoring fires TASKS_CHANGED, so open lists load it again.
const UndoDeleteProvider = ({ children }) => {
  // { kind: "deleted" | "restored" | "failed", task: { id, key }, projectId, text? }
  const [notice, setNotice] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const deleted = useCallback((task, projectId) => {
    setNotice({ kind: "deleted", task: { id: task.id, key: task.key }, projectId });
  }, []);
  const value = useMemo(() => ({ deleted }), [deleted]);

  const undo = async () => {
    const { task, projectId } = notice;
    setRestoring(true);
    try {
      await restoreTask(projectId, task.id);
      setNotice({ kind: "restored", task, projectId });
    } catch (err) {
      const text = errorMessage(err, `Couldn't restore ${task.key}. Please try again.`, TASK_ERROR_MESSAGES);
      setNotice({ kind: "failed", task, projectId, text });
    } finally {
      setRestoring(false);
    }
  };

  const close = (_, reason) => {
    // a click elsewhere shouldn't take the Undo away; only the timer or the close button do
    if (reason === "clickaway" || restoring) return;
    setNotice(null);
  };

  const severity = { deleted: "info", restored: "success", failed: "error" }[notice?.kind];
  const text = {
    deleted: `${notice?.task.key} was deleted.`,
    restored: `${notice?.task.key} is back.`,
    failed: notice?.text,
  }[notice?.kind];

  return (
    <UndoDeleteContext.Provider value={value}>
      {children}
      <Snackbar
        // a new notice restarts the timer
        key={`${notice?.kind}-${notice?.task.id}`}
        open={Boolean(notice)}
        autoHideDuration={notice?.kind === "deleted" ? UNDO_MS : 5000}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={severity}
          variant="filled"
          onClose={restoring ? undefined : () => setNotice(null)}
          action={
            notice?.kind === "deleted" && (
              <Button color="inherit" size="small" onClick={undo} loading={restoring} sx={{ fontWeight: 700 }}>
                Undo
              </Button>
            )
          }
          sx={{ width: "100%", alignItems: "center" }}
        >
          {text}
        </Alert>
      </Snackbar>
    </UndoDeleteContext.Provider>
  );
};

export default UndoDeleteProvider;

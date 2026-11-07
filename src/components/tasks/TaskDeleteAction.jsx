import { useState } from "react";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ConfirmDialog from "../general/ConfirmDialog";
import { deleteTask } from "../../api/tasksApi";
import { useUndoDelete } from "../../context/UndoDeleteContext";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { deleteTaskMessage } from "../../utils/task";

// Deleting a task or subtask, the same everywhere: the trigger, the red "Delete this task?" window, the request,
// then the Undo snackbar (UndoDeleteProvider). `trigger` "menu" is a "⋯" button with Delete in its menu (task page,
// subtask rows; `small` for the rows), "button" a red text button (the drawer's footer). `onDeleted()` runs after the
// delete went through, e.g. to leave the page or reload a list. Only render it for people who may edit tasks.
const TaskDeleteAction = ({ projectId, task, trigger = "menu", small = false, disabled = false, onDeleted }) => {
  const [menu, setMenu] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const remove = useSubmit(TASK_ERROR_MESSAGES);
  const undo = useUndoDelete();
  const noun = task.parentTaskId != null ? "subtask" : "task";

  const open = () => {
    setMenu(null);
    setConfirming(true);
  };

  const handleDelete = async () => {
    const { ok } = await remove.run(() => deleteTask(projectId, task.id));
    if (!ok) return;
    setConfirming(false);
    undo?.deleted(task, projectId);
    onDeleted?.();
  };

  return (
    <>
      {trigger === "button" ? (
        <Button color="error" onClick={open} disabled={disabled}>
          Delete
        </Button>
      ) : (
        <>
          <IconButton
            size={small ? "small" : "medium"}
            aria-label={`More actions for ${task.key}`}
            disabled={disabled}
            onClick={(e) => setMenu(e.currentTarget)}
          >
            <MoreHorizIcon fontSize={small ? "small" : "medium"} />
          </IconButton>
          <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
            <MenuItem sx={{ color: "error.main" }} onClick={open}>
              Delete {noun}
            </MenuItem>
          </Menu>
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete this ${noun}?`}
          message={deleteTaskMessage(task)}
          confirmLabel={`Delete ${noun}`}
          tone="danger"
          loading={remove.submitting}
          error={remove.error}
          onConfirm={handleDelete}
          onClose={() => {
            setConfirming(false);
            remove.clearError();
          }}
        />
      )}
    </>
  );
};

export default TaskDeleteAction;

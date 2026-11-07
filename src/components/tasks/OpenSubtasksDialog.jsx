import ConfirmDialog from "../general/ConfirmDialog";
import { subtaskProgress } from "../../utils/task";

// Moving a parent into a Done column while some of its subtasks aren't done is allowed, but only once the user
// confirms; then the same request goes again with `confirmOpenSubtasks: true`. Used by the task page, the drawer
// and board drags. `columnName` is where the task is going.
const OpenSubtasksDialog = ({ task, columnName, loading, onConfirm, onClose }) => {
  const progress = subtaskProgress(task);
  const open = progress.total - progress.done;
  const count = progress.total > 0 ? `${open} of ${progress.total} subtasks aren't done yet. ` : "";

  return (
    <ConfirmDialog
      title="Move to Done with open subtasks?"
      message={`${count}Move ${task.key} to ${columnName ?? "Done"} anyway? The subtasks keep their status.`}
      confirmLabel="Move anyway"
      tone="warning"
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

export default OpenSubtasksDialog;

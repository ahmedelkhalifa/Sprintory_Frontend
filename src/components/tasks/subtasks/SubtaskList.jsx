import { useState } from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import LoadState from "../../general/LoadState";
import SubtaskRow from "./SubtaskRow";
import AddSubtask from "./AddSubtask";
import { listSubtasks } from "../../../api/tasksApi";
import { useAsync } from "../../../hooks/useAsync";
import { useTasksChanged } from "../../../hooks/useTasksChanged";
import { TASK_ERROR_MESSAGES } from "../../../constants/tasks";
import { subtaskProgress } from "../../../utils/task";

// A task page's "Subtasks" section (PMP-132): how many are done ("3 / 5 done", counted by the backend from the
// Done-category columns, so it comes from the `parent`'s response), the subtasks oldest first, and Add subtask.
// One level only, so a subtask's own page doesn't show this. After any change the list reloads and `onChanged`
// refreshes the parent, whose counts moved.
const SubtaskList = ({ workspace, project, parent, columns, members, canEdit, onChanged }) => {
  const state = useAsync((signal) => listSubtasks(project.id, parent.id, signal), [project.id, parent.id], {
    fallback: "Couldn't load the subtasks. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  const [people, setPeople] = useState(members); // to name assignees, plus anyone picked beyond the first page
  const progress = subtaskProgress(parent);
  const subtasks = state.data ?? [];

  const changed = () => {
    state.reload();
    onChanged();
  };
  // a deleted subtask came back (Undo)
  useTasksChanged(project.id, changed);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>Subtasks</Typography>
        {progress.total > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {progress.done} / {progress.total} done
          </Typography>
        )}
      </Box>
      {progress.total > 0 && (
        <LinearProgress
          variant="determinate"
          value={progress.percent}
          color="success"
          aria-label={`${progress.done} of ${progress.total} subtasks done`}
          sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
        />
      )}

      {!state.data ? (
        <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={2} />
        </Paper>
      ) : subtasks.length > 0 ? (
        <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          {subtasks.map((subtask, index) => (
            <Box key={subtask.id} sx={{ borderTop: index > 0 ? 1 : 0, borderColor: "divider" }}>
              <SubtaskRow
                workspace={workspace}
                project={project}
                parentId={parent.id}
                subtask={subtask}
                columns={columns}
                people={people}
                canEdit={canEdit}
                onPersonPicked={(member) => setPeople((prev) => [...prev, member])}
                onChanged={changed}
              />
            </Box>
          ))}
        </Paper>
      ) : (
        !canEdit && (
          <Typography variant="body2" color="text.secondary">
            No subtasks.
          </Typography>
        )
      )}

      {canEdit && state.data && <AddSubtask projectId={project.id} parentId={parent.id} onCreated={changed} />}
    </Box>
  );
};

export default SubtaskList;

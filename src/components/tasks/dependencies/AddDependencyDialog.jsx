import { useState } from "react";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import ToneChip from "../../general/ToneChip";
import { addDependency } from "../../../api/dependenciesApi";
import { listTasks } from "../../../api/tasksApi";
import { usePagedList } from "../../../hooks/usePagedList";
import { useSubmit } from "../../../hooks/useSubmit";
import { TASK_STAGES } from "../../../constants/tasks";
import {
  DEPENDENCY_DIRECTIONS,
  DEPENDENCY_ERROR_MESSAGES,
  cycleMessage,
  cyclePathOf,
  dependencyCandidates,
  dependencyRequest,
  dependencyTaskLabel,
} from "../../../utils/dependency";

// "Add blocker" / "Add blocked task" window (`direction`, a DEPENDENCY_DIRECTIONS value) on `task`'s page: pick
// another top-level task of the project, searched on the server by title or key. The picker leaves out the task
// itself and the links that already exist this way (`dependencies`); the backend checks everything again. A refusal
// (a cycle with its path, a duplicate, a deleted task, ...) stays in the window so the user can pick another task.
const AddDependencyDialog = ({ open, projectId, task, direction, dependencies, onClose, onAdded }) => {
  const [picked, setPicked] = useState(null);
  const [refusal, setRefusal] = useState("");
  const submit = useSubmit(DEPENDENCY_ERROR_MESSAGES);
  const candidates = usePagedList((params, signal) => listTasks(projectId, params, signal), [projectId], {
    enabled: open,
    size: 20,
  });
  const options = dependencyCandidates(candidates.items, task.id, dependencies, direction);
  const { action } = DEPENDENCY_DIRECTIONS[direction];
  const blocks = direction === DEPENDENCY_DIRECTIONS.BLOCKS.value;

  const close = () => {
    if (!submit.submitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!picked) return;
    setRefusal("");
    const { ok, result, error } = await submit.run(() => addDependency(task.id, dependencyRequest(direction, task.id, picked.id)));
    if (ok) {
      onAdded(result);
      return;
    }
    // a cycle always shows its whole path, whatever the message says
    const path = cyclePathOf(error);
    if (path.length > 0 || error.response?.data?.code === "DEPENDENCY_CYCLE") {
      submit.clearError();
      setRefusal(cycleMessage(path));
    }
  };

  const error = refusal || submit.error;

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>{action}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {blocks
              ? `${task.key} must be done before the task you pick can proceed.`
              : `The task you pick must be done before ${task.key} can proceed.`}
          </Typography>
          <Autocomplete
            id="dependency-task"
            value={picked}
            onChange={(_, next) => {
              setPicked(next);
              setRefusal("");
              submit.clearError();
            }}
            onInputChange={(_, text, reason) => reason === "input" && candidates.setSearch(text)}
            options={options}
            filterOptions={(list) => list} // the server already searched
            getOptionLabel={dependencyTaskLabel}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            loading={candidates.loading}
            noOptionsText={candidates.search ? "No tasks match" : "No other tasks in this project"}
            renderOption={({ key, ...props }, option) => {
              const stage = TASK_STAGES[option.stage ?? option.statusCategory] ?? null;
              return (
                <Box component="li" key={key} {...props} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, flexShrink: 0 }}>
                    {option.key}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {option.title}
                  </Typography>
                  <ToneChip label={option.statusName} tone={stage?.tone ?? "text.secondary"} />
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} autoFocus size="small" label="Task" placeholder="Search by title or key" />
            )}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={close} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting} disabled={!picked}>
            {action}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AddDependencyDialog;

import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import { completeSprint } from "../../api/sprintsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { sprintProgress } from "../../utils/board";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// a number on top of a short label, for the done / unfinished summary
const Count = ({ value, label, tone }) => (
  <Box sx={{ flex: 1, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5, textAlign: "center" }}>
    <Typography sx={{ fontWeight: 700, fontSize: 24, color: tone }}>{value}</Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

// "Complete sprint" window: how much got done, and where the unfinished work goes (the backlog, a planned sprint,
// or a new sprint). Done means the board's last column; done tasks stay with the completed sprint.
const CompleteSprintDialog = ({ sprint, tasks, columns, plannedSprints, onClose, onCompleted }) => {
  const [target, setTarget] = useState("backlog"); // "backlog" | "new" | a planned sprint's id
  const submit = useSubmit(TASK_ERROR_MESSAGES);
  const { doneCount, totalCount } = sprintProgress(tasks, columns);
  const unfinished = totalCount - doneCount;
  const doneColumn = columns.at(-1)?.name ?? "Done";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      carryOverSprintId: typeof target === "number" ? target : null,
      createSprint: target === "new",
    };
    const { ok, result } = await submit.run(() => completeSprint(sprint.id, body));
    if (ok) onCompleted(result);
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Complete {sprint.name}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Tasks in {doneColumn} count as done and stay with this sprint.
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Count value={doneCount} label={doneCount === 1 ? "task done" : "tasks done"} tone="success.main" />
              <Count value={unfinished} label="unfinished" tone={unfinished > 0 ? "warning.main" : "text.secondary"} />
            </Box>
            {unfinished > 0 ? (
              <FormField
                id="complete-sprint-target"
                label={`Move ${plural(unfinished, "unfinished task")} to`}
                select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <MenuItem value="backlog">The backlog</MenuItem>
                {plannedSprints.map((planned) => (
                  <MenuItem key={planned.id} value={planned.id}>
                    {planned.name}
                  </MenuItem>
                ))}
                <MenuItem value="new">A new sprint</MenuItem>
              </FormField>
            ) : (
              <Alert severity="success">Everything in this sprint is done.</Alert>
            )}
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            Complete sprint
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CompleteSprintDialog;

import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import { completeSprint } from "../../api/sprintsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { doneColumnIds, sprintProgress } from "../../utils/board";
import { formatDate } from "../../utils/format";
import { GOAL_ACHIEVED } from "../../utils/sprint";

// the backend's limit for the note (sprints-docs §2)
const GOAL_NOTE_MAX = 1000;

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

// "Complete sprint" window: how much got done, whether the goal was achieved (required, with an optional note), and
// where the unfinished work goes (the backlog, a planned sprint, or a new sprint). Done means a column of category
// DONE; done tasks stay with the completed sprint. Before its end date the backend asks to confirm first
// (EARLY_CLOSE_CONFIRMATION_REQUIRED): the window then shows why and the button sends the confirmation.
const CompleteSprintDialog = ({ sprint, tasks, columns, plannedSprints, onClose, onCompleted }) => {
  const [target, setTarget] = useState("backlog"); // "backlog" | "new" | a planned sprint's id
  const [goalAchieved, setGoalAchieved] = useState("");
  const [goalNote, setGoalNote] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmEarly, setConfirmEarly] = useState(false); // the backend asked to confirm an early close
  const submit = useSubmit(TASK_ERROR_MESSAGES);
  const { doneCount, totalCount } = sprintProgress(tasks, columns);
  const unfinished = totalCount - doneCount;
  const doneIds = doneColumnIds(columns);
  const doneColumn = columns.filter((column) => doneIds.has(column.id)).map((column) => column.name).join(" or ") || "Done";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {
      ...(!goalAchieved && { goalAchieved: "Choose whether the sprint goal was achieved" }),
      ...(goalNote.trim().length > GOAL_NOTE_MAX && { goalNote: `Use at most ${GOAL_NOTE_MAX} characters` }),
    };
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      carryOverSprintId: typeof target === "number" ? target : null,
      createSprint: target === "new",
      goalAchieved,
      goalNote: goalNote.trim() || null,
      confirmEarlyClose: confirmEarly,
    };
    const { ok, result, error } = await submit.run(() => completeSprint(sprint.id, body));
    if (ok) {
      onCompleted(result);
      return;
    }
    const data = error.response?.data;
    if (data?.code === "EARLY_CLOSE_CONFIRMATION_REQUIRED") {
      setConfirmEarly(true);
      submit.clearError();
    } else if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors(data.fieldErrors);
      submit.clearError();
    }
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
            <FormField
              id="complete-sprint-goal-achieved"
              label="Was the sprint goal achieved?"
              select
              required
              value={goalAchieved}
              onChange={(e) => {
                setGoalAchieved(e.target.value);
                setErrors((prev) => ({ ...prev, goalAchieved: "" }));
              }}
              error={Boolean(errors.goalAchieved)}
              helperText={errors.goalAchieved || (sprint.goal ? `Goal: ${sprint.goal}` : "")}
            >
              {GOAL_ACHIEVED.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </FormField>
            <FormField
              id="complete-sprint-goal-note"
              label="Note"
              value={goalNote}
              onChange={(e) => setGoalNote(e.target.value)}
              placeholder="Optional: what helped or got in the way"
              multiline
              minRows={2}
              error={Boolean(errors.goalNote)}
              helperText={errors.goalNote}
            />
            {confirmEarly && (
              <Alert severity="warning">
                This sprint is planned until {formatDate(sprint.endDate)}. Close it early anyway?
              </Alert>
            )}
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color={confirmEarly ? "warning" : "primary"} loading={submit.submitting}>
            {confirmEarly ? "Close early" : "Complete sprint"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CompleteSprintDialog;

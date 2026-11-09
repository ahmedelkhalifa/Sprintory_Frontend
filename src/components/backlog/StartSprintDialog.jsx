import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import { startSprint } from "../../api/sprintsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { validateSprint } from "../../utils/validation";

const SPRINT_DAYS = 14;

// a date input's value ("2026-10-25") for today + `days`, in the user's own timezone
const dateInput = (days = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// "Start sprint" window: confirm the dates and goal; the sprint becomes active and shows on the board
const StartSprintDialog = ({ sprint, onClose, onStarted }) => {
  const [values, setValues] = useState({
    startDate: sprint.startDate || dateInput(),
    endDate: sprint.endDate || dateInput(SPRINT_DAYS),
    goal: sprint.goal ?? "",
  });
  const [errors, setErrors] = useState({});
  const submit = useSubmit(TASK_ERROR_MESSAGES);
  const count = sprint.tasks ? sprint.tasks.length : 0;

  const change = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateSprint(values, { requireDates: true }) || {};

    // AC Start #1: Require a sprint goal before starting
    if (!values.goal || !values.goal.trim()) {
      found.goal = "Add a Sprint Goal first.";
    }

    // AC Create/Plan #2: End date must be after start date
    if (values.startDate && values.endDate && new Date(values.endDate) <= new Date(values.startDate)) {
      found.endDate = "End date must be after start date.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { ok, error } = await submit.run(() => startSprint(sprint.id, { ...values, goal: values.goal.trim() }));
    if (ok) {
      onStarted();
      return;
    }
    const data = error?.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors(data.fieldErrors);
      submit.clearError();
    } else if (data?.code === "SPRINT_ALREADY_ACTIVE") {
      setErrors({ form: "Another sprint is already active in this project." });
      submit.clearError();
    }
  };

  return (
      <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Start {sprint.name}</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {count === 1 ? "1 task" : `${count} tasks`} will be in this sprint. Once it starts, the team works on it from the board.
            </Typography>
            <Stack spacing={2}>
              {errors.form && <Alert severity="error">{errors.form}</Alert>}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <FormField
                    id="start-sprint-start"
                    label="Start date"
                    type="date"
                    required
                    value={values.startDate}
                    onChange={change("startDate")}
                    error={Boolean(errors.startDate)}
                    helperText={errors.startDate}
                />
                <FormField
                    id="start-sprint-end"
                    label="End date"
                    type="date"
                    required
                    value={values.endDate}
                    onChange={change("endDate")}
                    error={Boolean(errors.endDate)}
                    helperText={errors.endDate}
                />
              </Box>
              <FormField
                  id="start-sprint-goal"
                  label="Sprint goal"
                  required
                  value={values.goal}
                  onChange={change("goal")}
                  placeholder="What should this sprint achieve?"
                  multiline
                  minRows={2}
                  error={Boolean(errors.goal)}
                  helperText={errors.goal}
              />
              {count === 0 && <Alert severity="info">This sprint has no tasks yet. You can still start it and add work later.</Alert>}
              {submit.error && <Alert severity="error">{submit.error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} disabled={submit.submitting} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" loading={submit.submitting}>
              Start sprint
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
  );
};

export default StartSprintDialog;
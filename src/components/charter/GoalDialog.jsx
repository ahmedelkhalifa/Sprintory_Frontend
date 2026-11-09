import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import { createCharterGoal, updateCharterGoal } from "../../api/charterApi";
import { useSubmit } from "../../hooks/useSubmit";
import { CHARTER_ERROR_MESSAGES, CHARTER_LIMITS } from "../../constants/charter";
import { charterFieldErrors, goalRequest, goalValues, validateGoal } from "../../utils/charter";

// Add a goal (`goal` null, it goes last) or edit one: a required title and an optional success measure
// ("Reduce onboarding time" → "Under 1 day"). `onSaved(goal)` runs once the backend took it.
const GoalDialog = ({ projectId, goal = null, onSaved, onClose }) => {
  const adding = goal === null;
  const [values, setValues] = useState(goalValues(goal));
  const [errors, setErrors] = useState({});
  const submit = useSubmit(CHARTER_ERROR_MESSAGES);

  const change = (field) => (event) => {
    setValues({ ...values, [field]: event.target.value });
    setErrors({ ...errors, [field]: "" });
    submit.clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problems = validateGoal(values);
    if (Object.keys(problems).length > 0) return setErrors(problems);

    const body = goalRequest(values);
    const { ok, result, error } = await submit.run(() =>
      adding ? createCharterGoal(projectId, body) : updateCharterGoal(projectId, goal.id, body),
    );
    if (ok) return onSaved(result);
    // a VALIDATION_ERROR names the fields: show it on them
    const fieldErrors = charterFieldErrors(error, ["title", "successMeasure"]);
    if (fieldErrors) {
      setErrors(fieldErrors);
      submit.clearError();
    }
  };

  const titleLength = values.title.trim().length;

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{adding ? "Add goal" : "Edit goal"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormField
              id="goal-title"
              label="Goal"
              autoFocus
              required
              value={values.title}
              onChange={change("title")}
              error={Boolean(errors.title)}
              helperText={errors.title || `${titleLength} / ${CHARTER_LIMITS.GOAL_TITLE}`}
              placeholder="e.g. Reduce onboarding time"
            />
            <FormField
              id="goal-measure"
              label="Success measure (optional)"
              multiline
              minRows={2}
              value={values.successMeasure}
              onChange={change("successMeasure")}
              error={Boolean(errors.successMeasure)}
              helperText={errors.successMeasure || "How you'll know the goal is reached, e.g. Under 1 day."}
              placeholder="e.g. Under 1 day"
            />
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            {adding ? "Add goal" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default GoalDialog;

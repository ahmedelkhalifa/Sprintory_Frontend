import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import { createSprint, updateSprint } from "../../api/sprintsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { validateSprint } from "../../utils/validation";

const FIELDS = ["name", "goal", "capacity", "startDate", "endDate"];

// "Create sprint" / "Edit sprint" window: name, goal, capacity (same unit as task estimates) and optional dates.
// Without `sprint` it creates one; a blank name lets the backend number it ("WR Sprint 3").
const SprintDialog = ({ projectId, sprint, onClose, onSaved }) => {
  const editing = Boolean(sprint);
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((field) => [field, sprint?.[field] ?? ""])),
  );
  const [errors, setErrors] = useState({});
  const submit = useSubmit(TASK_ERROR_MESSAGES);

  const change = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // an active sprint keeps its dates
    const found = validateSprint(values, { requireDates: sprint?.status === "ACTIVE" });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: values.name.trim(),
      goal: values.goal.trim(),
      capacity: values.capacity === "" ? null : Number(values.capacity),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };
    const { ok, error } = await submit.run(() => (editing ? updateSprint(sprint.id, body) : createSprint(projectId, body)));
    if (ok) {
      onSaved();
      return;
    }
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors(data.fieldErrors);
      submit.clearError();
    }
  };

  const field = (name) => ({
    id: `sprint-${name}`,
    value: values[name],
    onChange: change(name),
    error: Boolean(errors[name]),
    helperText: errors[name],
  });

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit sprint" : "Create sprint"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormField
              {...field("name")}
              label="Sprint name"
              placeholder={editing ? "" : "Leave blank to number it automatically"}
              autoFocus
            />
            <FormField {...field("goal")} label="Sprint goal" placeholder="What should this sprint achieve?" multiline minRows={2} />
            <FormField
              {...field("capacity")}
              label="Capacity"
              type="number"
              placeholder="Optional, in the same unit as task estimates"
              slotProps={{ htmlInput: { min: 0, step: "any" } }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <FormField {...field("startDate")} label="Start date" type="date" />
              <FormField {...field("endDate")} label="End date" type="date" />
            </Box>
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            {editing ? "Save" : "Create sprint"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default SprintDialog;

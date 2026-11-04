import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import { createBoardColumn, updateBoardColumn } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { COLUMN_ERROR_MESSAGES, TASK_STAGES } from "../../constants/tasks";
import { defaultAfterColumnId } from "../../utils/board";
import { columnCategory } from "../../utils/task";
import { validateBoardColumn } from "../../utils/validation";

const categoryHelp = (rules, category) => {
  if (rules?.backlog) return "The backlog is always a To do column.";
  if (rules?.categoryLocked) return `The board's only ${TASK_STAGES[category].label} column keeps its category.`;
  return "Reports go by category: tasks in a Done column count as finished.";
};

// Add a column (`column` null) or edit one: its name, its category (To do / In progress / Done) and, for a new one,
// where it goes (default: before the first Done column). `rules` (columnRules) lock the category of the Kanban
// backlog and of the board's only To do / Done column. `onSaved` runs once the backend took it.
const ColumnDialog = ({ projectId, column = null, columns, rules = null, onSaved, onClose }) => {
  const adding = column === null;
  const currentCategory = adding ? null : columnCategory(column, columns);
  const [values, setValues] = useState({
    name: column?.name ?? "",
    category: currentCategory ?? "IN_PROGRESS",
    afterColumnId: adding ? (defaultAfterColumnId(columns) ?? "") : "",
  });
  const [errors, setErrors] = useState({});
  const submit = useSubmit(COLUMN_ERROR_MESSAGES);

  const change = (field) => (event) => {
    setValues({ ...values, [field]: event.target.value });
    setErrors({ ...errors, [field]: "" });
    submit.clearError();
  };

  // only what changed; a column that becomes Done loses its WIP limit in the same request (the backend wants both)
  const editChanges = () => {
    const changes = {};
    const name = values.name.trim();
    if (name !== column.name) changes.name = name;
    if (values.category !== currentCategory) changes.category = values.category;
    if (changes.category === "DONE" && column.wipLimit != null) changes.clearWipLimit = true;
    return changes;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problems = validateBoardColumn(values, columns, column?.id ?? null);
    if (Object.keys(problems).length > 0) return setErrors(problems);

    let save;
    if (adding) {
      const body = { name: values.name.trim(), category: values.category, afterColumnId: values.afterColumnId || null };
      save = () => createBoardColumn(projectId, body);
    } else {
      const changes = editChanges();
      if (Object.keys(changes).length === 0) return onClose();
      save = () => updateBoardColumn(projectId, column.id, changes);
    }
    const { ok, error } = await submit.run(save);
    if (ok) return onSaved();
    // a VALIDATION_ERROR names the fields: show it on them
    const fieldErrors = error?.response?.data?.fieldErrors;
    if (fieldErrors) {
      setErrors(fieldErrors);
      submit.clearError();
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{adding ? "Add column" : "Edit column"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormField
              id="column-name"
              label="Name"
              autoFocus
              value={values.name}
              onChange={change("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
              placeholder="e.g. In Review"
            />
            <FormField
              id="column-category"
              label="Category"
              select
              value={values.category}
              onChange={change("category")}
              disabled={Boolean(rules?.categoryLocked)}
              error={Boolean(errors.category)}
              helperText={errors.category || categoryHelp(rules, values.category)}
            >
              {Object.values(TASK_STAGES).map((stage) => (
                <MenuItem key={stage.value} value={stage.value}>
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: stage.tone }} />
                    {stage.label}
                  </Box>
                </MenuItem>
              ))}
            </FormField>
            {adding && (
              <FormField
                id="column-after"
                label="Place after"
                select
                value={values.afterColumnId}
                onChange={change("afterColumnId")}
                helperText="The new column goes right after this one."
              >
                {columns.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </FormField>
            )}
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            {adding ? "Add column" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ColumnDialog;

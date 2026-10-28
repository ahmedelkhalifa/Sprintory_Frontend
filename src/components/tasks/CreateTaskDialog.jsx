import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import AssigneePicker from "./AssigneePicker";
import TaskValueSelect from "./TaskValueSelect";
import { createTask } from "../../api/tasksApi";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES, TASK_PRIORITIES, TASK_TYPES } from "../../constants/tasks";
import { TASK_TITLE_MAX, validateTask } from "../../utils/validation";

const INITIAL_VALUES = {
  title: "",
  type: TASK_TYPES.STORY.value,
  priority: TASK_PRIORITIES.MEDIUM.value,
  estimate: "",
  assignee: null,
  description: "",
};

// only what was filled in; the backend defaults the rest (and puts the task in the first column, last in the backlog)
const createBody = (values) => ({
  title: values.title.trim(),
  type: values.type,
  priority: values.priority,
  ...(values.estimate !== "" && { estimate: Number(values.estimate) }),
  ...(values.assignee && { assigneeId: values.assignee.userId }),
  ...(values.description.trim() && { description: values.description.trim() }),
});

// "Create task" window from the project page's Quick actions (EDIT_TASKS): title, type, priority, estimate,
// assignee and description. Labels and the status are set later in the task's drawer.
// `onCreated(task)` gets the TaskResponse.
const CreateTaskDialog = ({ project, onClose, onCreated }) => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const submit = useSubmit(TASK_ERROR_MESSAGES);

  const set = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { ok, result, error } = await submit.run(() => createTask(project.id, createBody(values)));
    if (ok) {
      onCreated(result);
      return;
    }
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors(data.fieldErrors);
      submit.clearError();
    }
  };

  const field = (name) => ({
    id: `new-task-${name}`,
    value: values[name],
    onChange: (e) => set(name, e.target.value),
    error: Boolean(errors[name]),
    helperText: errors[name],
  });

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create task</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <FormField
              {...field("title")}
              label="Title"
              placeholder="What needs to be done?"
              autoFocus
              slotProps={{ htmlInput: { maxLength: TASK_TITLE_MAX } }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
              <TaskValueSelect {...field("type")} label="Type" values={TASK_TYPES} />
              <TaskValueSelect {...field("priority")} label="Priority" values={TASK_PRIORITIES} />
              <FormField
                {...field("estimate")}
                label="Estimate"
                type="number"
                placeholder="None"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Box>
            <AssigneePicker
              id="new-task-assignee"
              projectId={project.id}
              value={values.assignee}
              onChange={(member) => set("assignee", member)}
            />
            <FormField {...field("description")} label="Description" multiline minRows={4} placeholder="Add more detail" />
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            Create task
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CreateTaskDialog;

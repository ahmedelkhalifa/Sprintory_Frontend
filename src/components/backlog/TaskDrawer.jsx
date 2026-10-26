import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Drawer,
  FormLabel,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FormField from "../forms/FormField";
import ConfirmDialog from "../general/ConfirmDialog";
import UserAvatar from "../general/UserAvatar";
import { deleteTask, getTask, updateTask } from "../../api/tasksApi";
import { listProjectMembers } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { usePagedList } from "../../hooks/usePagedList";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES, TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "../../constants/tasks";
import { memberLabel } from "../../utils/people";
import { taskPath } from "../../utils/task";
import { validateTask } from "../../utils/validation";

// a label above a field that isn't a FormField (the pickers)
const Field = ({ id, label, children }) => (
  <Box>
    <FormLabel htmlFor={id} sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}>
      {label}
    </FormLabel>
    {children}
  </Box>
);

// a select built from one of the task value maps (types, priorities, statuses)
const valueOptions = (values) =>
  Object.values(values).map(({ value, label, Icon, tone }) => (
    <MenuItem key={value} value={value}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {Icon ? (
          <Icon fontSize="small" sx={{ color: tone }} />
        ) : (
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tone }} />
        )}
        {label}
      </Box>
    </MenuItem>
  ));

// only the person fields the task keeps for its assignee
const asAssignee = (member) =>
  member && { userId: member.userId, firstName: member.firstName, lastName: member.lastName, email: member.email };

const fromTask = (task) => ({
  title: task.title,
  description: task.description ?? "",
  type: task.type,
  priority: task.priority,
  status: task.status,
  estimate: task.estimate ?? "",
  labels: task.labels ?? [],
  assignee: task.assignee ?? null,
});

// The editable fields of one task. Read-only (disabled) without EDIT_TASKS or in an archived project.
const TaskForm = ({ project, task, labels, canEdit, onClose, onChanged }) => {
  const [values, setValues] = useState(() => fromTask(task));
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSubmit(TASK_ERROR_MESSAGES);
  const remove = useSubmit(TASK_ERROR_MESSAGES);
  // the project's members, searched on the server as the user types
  const people = usePagedList(
    (params, signal) => listProjectMembers(project.id, params, signal),
    [project.id],
    { enabled: canEdit, size: 20 },
  );

  const set = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const change = (field) => (e) => set(field, e.target.value);
  // the current assignee stays a valid option even when the search doesn't return them
  const current = values.assignee;
  const assigneeOptions =
    current && !people.items.some((member) => member.userId === current.userId) ? [current, ...people.items] : people.items;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { assignee, ...fields } = values;
    const changes = {
      ...fields,
      title: values.title.trim(),
      description: values.description.trim(),
      estimate: values.estimate === "" ? null : Number(values.estimate),
      assigneeId: assignee?.userId ?? null,
    };
    const { ok, error } = await save.run(() => updateTask(task.id, changes));
    if (ok) {
      onChanged();
      onClose();
      return;
    }
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors(data.fieldErrors);
      save.clearError();
    }
  };

  const handleDelete = async () => {
    const { ok } = await remove.run(() => deleteTask(task.id));
    if (ok) {
      onChanged();
      onClose();
    }
  };

  const field = (name) => ({
    id: `task-${name}`,
    value: values[name],
    onChange: change(name),
    error: Boolean(errors[name]),
    helperText: errors[name],
    disabled: !canEdit,
  });

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Stack spacing={2.5} sx={{ p: 3, overflowY: "auto", flex: 1 }}>
        <FormField {...field("title")} label="Title" slotProps={{ htmlInput: { maxLength: 200 } }} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <FormField {...field("status")} label="Status" select>
            {valueOptions(TASK_STATUSES)}
          </FormField>
          <FormField {...field("type")} label="Type" select>
            {valueOptions(TASK_TYPES)}
          </FormField>
          <FormField {...field("priority")} label="Priority" select>
            {valueOptions(TASK_PRIORITIES)}
          </FormField>
          <FormField
            {...field("estimate")}
            label="Estimate"
            type="number"
            placeholder="None"
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
        </Box>

        <Field id="task-assignee" label="Assignee">
          <Autocomplete
            id="task-assignee"
            value={values.assignee}
            onChange={(_, member) => set("assignee", asAssignee(member))}
            onInputChange={(_, text, reason) => reason === "input" && people.setSearch(text)}
            options={assigneeOptions}
            filterOptions={(options) => options} // the server already searched
            getOptionLabel={memberLabel}
            isOptionEqualToValue={(option, value) => option.userId === value.userId}
            loading={people.loading}
            disabled={!canEdit}
            noOptionsText={people.search ? "No members match" : "No members"}
            renderOption={({ key, ...props }, member) => (
              <Box component="li" key={key} {...props} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <UserAvatar user={member} size={26} />
                {memberLabel(member)}
              </Box>
            )}
            renderInput={(params) => <TextField {...params} size="small" placeholder="Unassigned" />}
          />
        </Field>

        <Field id="task-labels" label="Labels">
          <Autocomplete
            id="task-labels"
            multiple
            freeSolo
            value={values.labels}
            onChange={(_, next) => set("labels", [...new Set(next.map((label) => label.trim()).filter(Boolean))])}
            options={labels}
            disabled={!canEdit}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder={values.labels.length ? "" : "Type a label and press Enter"} />
            )}
          />
        </Field>

        <FormField {...field("description")} label="Description" multiline minRows={5} placeholder="Add more detail" />

        {save.error && <Alert severity="error">{save.error}</Alert>}
      </Stack>

      {canEdit && (
        <>
          <Divider />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 3, py: 2 }}>
            <Button color="error" onClick={() => setConfirmDelete(true)} disabled={save.submitting}>
              Delete
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={onClose} color="inherit" disabled={save.submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" loading={save.submitting}>
              Save
            </Button>
          </Box>
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={`${task.key} "${task.title}" will be deleted. This can't be undone.`}
          confirmLabel="Delete task"
          destructive
          loading={remove.submitting}
          error={remove.error}
          onConfirm={handleDelete}
          onClose={() => {
            setConfirmDelete(false);
            remove.clearError();
          }}
        />
      )}
    </Box>
  );
};

// Side panel with one task's details, opened from a backlog row. "Open full page" goes to the task's own page.
// `labels` are the project's labels, suggested in the label picker; `onChanged` runs after a save or delete.
const TaskDrawer = ({ project, taskId, labels, canEdit, onClose, onChanged }) => {
  const taskState = useAsync((signal) => getTask(taskId, signal), [taskId], {
    fallback: "Couldn't load the task. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  const task = taskState.data;
  const type = TASK_TYPES[task?.type];

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 560 }, display: "flex", flexDirection: "column" } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
        {type && <type.Icon fontSize="small" sx={{ color: type.tone }} />}
        <Typography sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
          {task ? task.key : "Task"}
        </Typography>
        <Button
          component={RouterLink}
          to={taskPath(project, taskId)}
          size="small"
          endIcon={<OpenInNewIcon fontSize="small" />}
        >
          Open full page
        </Button>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {task ? (
        <TaskForm
          key={`${task.id}-${task.updatedAt}`}
          project={project}
          task={task}
          labels={labels}
          canEdit={canEdit}
          onClose={onClose}
          onChanged={onChanged}
        />
      ) : taskState.error ? (
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={taskState.reload}>
                Try again
              </Button>
            }
          >
            {taskState.error}
          </Alert>
        </Box>
      ) : (
        <Stack spacing={2} sx={{ p: 3 }}>
          <Skeleton height={56} />
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={160} />
        </Stack>
      )}
    </Drawer>
  );
};

export default TaskDrawer;

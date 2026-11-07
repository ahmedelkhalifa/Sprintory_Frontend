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
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FormField from "../forms/FormField";
import RichTextEditor from "../editor/RichTextEditor";
import AssigneePicker from "./AssigneePicker";
import OpenSubtasksDialog from "./OpenSubtasksDialog";
import TaskDeleteAction from "./TaskDeleteAction";
import TaskValueSelect from "./TaskValueSelect";
import TaskWatchToggle from "./TaskWatchToggle";
import { columnOptions } from "./columnOptions";
import { getTask, updateTask } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { TASK_ERROR_MESSAGES, TASK_PRIORITIES, TASK_TYPES } from "../../constants/tasks";
import { findAssignee, needsSubtaskConfirmation, taskChanges, taskPath, taskValues } from "../../utils/task";
import { isRichTextError, richTextValue } from "../../utils/richText";
import { TASK_TITLE_MAX, validateTask } from "../../utils/validation";

// a label above a field that isn't a FormField (the pickers)
const Field = ({ id, label, children }) => (
  <Box>
    <FormLabel htmlFor={id} sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}>
      {label}
    </FormLabel>
    {children}
  </Box>
);

// the form's values: the page's ones (taskValues), with the assignee as a person for the picker
const fromTask = (task, members) => ({ ...taskValues(task), assignee: findAssignee(task.assigneeId, members) });

// The editable fields of one task. Read-only (disabled) without EDIT_TASKS or in an archived project.
const TaskForm = ({ project, task, columns, members, labels, canEdit, onClose, onChanged }) => {
  const [values, setValues] = useState(() => fromTask(task, members));
  const [errors, setErrors] = useState({});
  // a move to Done the backend refused because subtasks are open: the same changes, waiting for a confirmation
  const [confirmDone, setConfirmDone] = useState(null);
  const save = useSubmit(TASK_ERROR_MESSAGES);

  const send = async (changes) => {
    const { ok, error, result } = await save.run(() => updateTask(project.id, task.id, changes));
    if (ok) {
      onChanged(result);
      onClose();
      return;
    }
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors(data.fieldErrors);
      save.clearError();
    } else if (isRichTextError(error)) {
      // a refused description or mention (backend mentions-docs §5) goes under the description
      setErrors({ description: data.message });
      save.clearError();
    } else if (needsSubtaskConfirmation(error)) {
      save.clearError();
      setConfirmDone(changes);
    }
  };

  const set = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const change = (field) => (e) => set(field, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const changes = taskChanges(task, { ...values, assigneeId: values.assignee?.userId ?? null });
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    send(changes);
  };

  const moveToDoneAnyway = () => {
    const changes = confirmDone;
    setConfirmDone(null);
    send({ ...changes, confirmOpenSubtasks: true });
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
        <FormField {...field("title")} label="Title" slotProps={{ htmlInput: { maxLength: TASK_TITLE_MAX } }} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <FormField {...field("statusId")} label="Status" select>
            {columnOptions(columns)}
          </FormField>
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
          id="task-assignee"
          projectId={project.id}
          value={values.assignee}
          onChange={(member) => set("assignee", member)}
          disabled={!canEdit}
        />

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
              <TextField
                {...params}
                size="small"
                placeholder={values.labels.length ? "" : "Type a label and press Enter"}
                error={Boolean(errors.labels)}
                helperText={errors.labels}
              />
            )}
          />
        </Field>

        <Field id="task-description" label="Description">
          <RichTextEditor
            value={task.description}
            onChange={(doc) => set("description", richTextValue(doc))}
            projectId={project.id}
            placeholder="Add more detail... Type @ to mention someone"
            disabled={!canEdit}
            error={Boolean(errors.description)}
            ariaLabel="Description"
            minHeight={120}
          />
          {errors.description && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5, mx: 1.75 }}>
              {errors.description}
            </Typography>
          )}
        </Field>

        {save.error && <Alert severity="error">{save.error}</Alert>}
      </Stack>

      {canEdit && (
        <>
          <Divider />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 3, py: 2 }}>
            <TaskDeleteAction
              projectId={project.id}
              task={task}
              trigger="button"
              disabled={save.submitting}
              onDeleted={() => {
                onChanged();
                onClose();
              }}
            />
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

      {confirmDone && (
        <OpenSubtasksDialog
          task={task}
          columnName={columns.find((column) => column.id === confirmDone.statusId)?.name}
          onConfirm={moveToDoneAnyway}
          onClose={() => setConfirmDone(null)}
        />
      )}
    </Box>
  );
};

// Side panel with one task's details, opened from a backlog row or a board card. "Open full page" goes to the
// task's own page. `columns` are the board's (the status choices), `members` the project's (to name the assignee),
// `labels` the project's labels, suggested in the label picker; `onChanged` runs after a save (with the saved task,
// which may carry a `wipWarning`) or a delete (with nothing).
const TaskDrawer = ({ project, taskId, columns, members, labels, canEdit, onClose, onChanged }) => {
  const { workspace } = useWorkspaceAccess();
  const taskState = useAsync((signal) => getTask(project.id, taskId, signal), [project.id, taskId], {
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
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, px: { xs: 2, sm: 3 }, py: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {type && <type.Icon fontSize="small" sx={{ color: type.tone }} />}
        <Typography sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }} noWrap>
          {task ? task.key : "Task"}
        </Typography>
        {/* a personal setting, so also for viewers and archived projects */}
        <TaskWatchToggle projectId={project.id} taskId={taskId} />
        {/* only the icon on phones, so the header fits next to Watch */}
        <Button
          component={RouterLink}
          to={taskPath(workspace, project, taskId)}
          size="small"
          aria-label="Open full page"
          endIcon={<OpenInNewIcon fontSize="small" />}
          sx={{ minWidth: 0, flexShrink: 0, "& .MuiButton-endIcon": { ml: { xs: 0, sm: 1 } } }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Open full page
          </Box>
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
          columns={columns}
          members={members}
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

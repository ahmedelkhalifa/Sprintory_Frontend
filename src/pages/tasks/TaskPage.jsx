import { useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import FormField from "../../components/forms/FormField";
import ConfirmDialog from "../../components/general/ConfirmDialog";
import LoadState from "../../components/general/LoadState";
import PageLayout from "../../components/layouts/PageLayout";
import AssigneePicker from "../../components/tasks/AssigneePicker";
import DetailRow from "../../components/tasks/DetailRow";
import NoWorkAccess from "../../components/tasks/NoWorkAccess";
import OpenSubtasksDialog from "../../components/tasks/OpenSubtasksDialog";
import TaskActivity from "../../components/tasks/TaskActivity";
import TaskStatusSelect from "../../components/tasks/TaskStatusSelect";
import TaskTitleField from "../../components/tasks/TaskTitleField";
import TaskValueSelect from "../../components/tasks/TaskValueSelect";
import SubtaskList from "../../components/tasks/subtasks/SubtaskList";
import SubtaskView from "../../components/tasks/subtasks/SubtaskView";
import TaskWatchToggle from "../../components/tasks/TaskWatchToggle";
import { loadWork } from "../../components/tasks/loadWork";
import { deleteTask, getTask, updateTask } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { useSubmit } from "../../hooks/useSubmit";
import { PERMISSIONS } from "../../constants/projects";
import { TASK_ERROR_MESSAGES, TASK_PRIORITIES, TASK_TYPES } from "../../constants/tasks";
import { can, isProjectArchived, projectPath } from "../../utils/project";
import { wipWarningText } from "../../utils/board";
import {
  deleteTaskMessage,
  formatEstimate,
  needsSubtaskConfirmation,
  projectLabels,
  taskChanges,
  taskValues,
} from "../../utils/task";
import { validateTask } from "../../utils/validation";
import { isWorkspaceArchived } from "../../utils/workspace";

// the description: text until clicked, then a box with Save and Cancel. A failed save keeps the box open.
const DescriptionField = ({ description, canEdit, saving, onSave }) => {
  const [draft, setDraft] = useState(null); // null: showing the description

  if (draft !== null) {
    return (
      <Box>
        <TextField
          autoFocus
          multiline
          fullWidth
          minRows={6}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          slotProps={{ htmlInput: { "aria-label": "Description" } }}
        />
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant="contained"
            size="small"
            loading={saving}
            onClick={async () => {
              const { ok } = await onSave(draft);
              if (ok) setDraft(null);
            }}
          >
            Save
          </Button>
          <Button size="small" color="inherit" disabled={saving} onClick={() => setDraft(null)}>
            Cancel
          </Button>
        </Box>
      </Box>
    );
  }
  return (
    <Box
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={() => canEdit && setDraft(description ?? "")}
      onKeyDown={(e) => canEdit && e.key === "Enter" && setDraft(description ?? "")}
      sx={{
        borderRadius: 1,
        px: 1,
        py: 0.5,
        mx: -1,
        minHeight: 40,
        cursor: canEdit ? "text" : "default",
        "&:hover": canEdit ? { bgcolor: "action.hover" } : undefined,
      }}
    >
      {description ? (
        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{description}</Typography>
      ) : (
        <Typography color="text.disabled">{canEdit ? "Add a description..." : "No description"}</Typography>
      )}
    </Box>
  );
};

// The loaded task and its fields. Every change is saved at once, like in Jira: one field at a time, checked with
// validateTask and sent as taskChanges (only what changed, clear flags for emptied fields). Under the description
// come its subtasks (SubtaskList) and the activity (TaskActivity).
// `canEdit` = EDIT_TASKS and neither the workspace nor the project archived.
const TaskView = ({ workspace, project, initialTask, columns, members, labels, canEdit }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(initialTask);
  const [errors, setErrors] = useState({});
  const [estimate, setEstimate] = useState(null); // the typed estimate, until it's saved
  const [people, setPeople] = useState(members); // to name the assignee, plus anyone picked beyond the first page
  const [menu, setMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // a move to Done the backend refused because subtasks are open: the same changes, waiting for a confirmation
  const [confirmDone, setConfirmDone] = useState(null);
  const [wipNotice, setWipNotice] = useState(null); // a status change put the task over a column's WIP limit
  const save = useSubmit(TASK_ERROR_MESSAGES);
  const remove = useSubmit(TASK_ERROR_MESSAGES);
  // only the latest subtask refresh may land (see refreshTask)
  const refreshCount = useRef(0);
  // one save at a time: each change is computed from the task the last save returned
  const locked = !canEdit || save.submitting;

  const saved = (result) => {
    setTask(result);
    setWipNotice(wipWarningText(result.wipWarning, columns));
  };

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // `patch` = the edited field(s). { ok } when the task now has them; `invalid` when a field error is showing
  const saveFields = async (patch) => {
    const fields = Object.keys(patch);
    const values = { ...taskValues(task), ...patch };
    const found = validateTask(values);
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(fields.map((field) => [field, found[field] ?? ""])) }));
    if (fields.some((field) => found[field])) return { ok: false, invalid: true };

    const changes = taskChanges(task, values);
    if (Object.keys(changes).length === 0) return { ok: true };
    const { ok, result, error } = await save.run(() => updateTask(project.id, task.id, changes));
    if (ok) {
      saved(result);
      return { ok: true };
    }
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors((prev) => ({ ...prev, ...data.fieldErrors }));
      save.clearError();
      return { ok: false, invalid: true };
    }
    // into Done with open subtasks: allowed, but only once the user confirms (backend tasks-docs §10.3)
    if (needsSubtaskConfirmation(error)) {
      save.clearError();
      setConfirmDone(changes);
    }
    return { ok: false };
  };

  const moveToDoneAnyway = async () => {
    const { ok, result } = await save.run(() => updateTask(project.id, task.id, { ...confirmDone, confirmOpenSubtasks: true }));
    setConfirmDone(null);
    if (ok) saved(result);
  };

  // a subtask was added, changed or deleted: the parent's "3 / 5 done" comes from the backend, so ask again.
  // Only the counts are taken: a field saved meanwhile must not be overwritten by an older copy of the task,
  // and of several refreshes only the last one counts
  const refreshTask = () => {
    const request = ++refreshCount.current;
    getTask(project.id, task.id)
      .then((fresh) => {
        if (request !== refreshCount.current) return;
        setTask((prev) => ({ ...prev, subtaskDone: fresh.subtaskDone, subtaskTotal: fresh.subtaskTotal }));
      })
      .catch(() => {}); // the counts stay as they were; the list itself already shows the change
  };

  const saveEstimate = async () => {
    if (estimate === null) return;
    const { ok, invalid } = await saveFields({ estimate: estimate.trim() });
    // keep an invalid value to fix; after a refusal show the task's estimate again
    if (ok || !invalid) setEstimate(null);
  };

  const saveAssignee = (member) => {
    if (member && !people.some((person) => person.userId === member.userId)) setPeople((prev) => [...prev, member]);
    saveFields({ assigneeId: member?.userId ?? null });
  };

  const handleDelete = async () => {
    const { ok } = await remove.run(() => deleteTask(project.id, task.id));
    if (!ok) return;
    // back to the board / backlog it was opened from; a link opened directly ("default") has no page before it
    if (location.key !== "default") navigate(-1);
    else navigate(projectPath(workspace, project), { replace: true });
  };

  // the response only has assigneeId: the member list gives the name, or at least the id
  const assignee =
    task.assigneeId == null ? null : (people.find((m) => m.userId === task.assigneeId) ?? { userId: task.assigneeId });
  const type = TASK_TYPES[task.type];
  const doneColumn = confirmDone && columns.find((column) => column.id === confirmDone.statusId);

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to={projectPath(workspace, project)} underline="hover" color="inherit">
          {project.name}
        </Link>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.primary" }}>
          {type && <type.Icon fontSize="small" sx={{ color: type.tone }} />}
          <Typography>{task.key}</Typography>
        </Box>
      </Breadcrumbs>

      {save.error && (
        <Alert severity="error" onClose={save.clearError} sx={{ mb: 2 }}>
          {save.error}
        </Alert>
      )}
      {wipNotice && (
        <Alert severity="warning" onClose={() => setWipNotice(null)} sx={{ mb: 2 }}>
          {wipNotice}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 380px" },
          gap: 4,
          alignItems: "start",
        }}
      >
        {/* left: the title, the description, the subtasks and the activity */}
        <Box>
          <TaskTitleField
            title={task.title}
            canEdit={canEdit}
            error={errors.title}
            onEdit={() => clearError("title")}
            onSave={(title) => saveFields({ title })}
          />

          <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>Description</Typography>
          <DescriptionField
            description={task.description}
            canEdit={canEdit}
            saving={save.submitting}
            onSave={(description) => saveFields({ description })}
          />

          <SubtaskList
            workspace={workspace}
            project={project}
            parent={task}
            columns={columns}
            members={people}
            canEdit={canEdit}
            onChanged={refreshTask}
          />

          <TaskActivity project={project} task={task} members={people} />
        </Box>

        {/* right: the status, the details and the dates */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TaskStatusSelect
              value={task.statusId}
              columns={columns}
              canEdit={canEdit}
              disabled={locked}
              onChange={(statusId) => saveFields({ statusId })}
            />
            <Box sx={{ flexGrow: 1 }} />
            {/* a personal setting, so also for viewers and archived projects */}
            <TaskWatchToggle projectId={project.id} taskId={task.id} />
            {canEdit && (
              <>
                <IconButton aria-label="More actions" onClick={(e) => setMenu(e.currentTarget)}>
                  <MoreHorizIcon />
                </IconButton>
                <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
                  <MenuItem
                    sx={{ color: "error.main" }}
                    onClick={() => {
                      setMenu(null);
                      setConfirmDelete(true);
                    }}
                  >
                    Delete task
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          <Accordion
            defaultExpanded
            disableGutters
            elevation={0}
            sx={{ border: 1, borderColor: "divider", borderRadius: 2, "&:before": { display: "none" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <DetailRow id="task-assignee" label="Assignee">
                <AssigneePicker
                  id="task-assignee"
                  label={null}
                  projectId={project.id}
                  value={assignee}
                  onChange={saveAssignee}
                  disabled={locked}
                />
              </DetailRow>
              <DetailRow id="task-priority" label="Priority">
                <TaskValueSelect
                  id="task-priority"
                  values={TASK_PRIORITIES}
                  value={task.priority}
                  disabled={locked}
                  onChange={(e) => saveFields({ priority: e.target.value })}
                />
              </DetailRow>
              <DetailRow id="task-type" label="Type">
                <TaskValueSelect
                  id="task-type"
                  values={TASK_TYPES}
                  value={task.type}
                  disabled={locked}
                  onChange={(e) => saveFields({ type: e.target.value })}
                />
              </DetailRow>
              <DetailRow id="task-labels" label="Labels">
                <Autocomplete
                  id="task-labels"
                  multiple
                  freeSolo
                  options={labels}
                  value={task.labels ?? []}
                  disabled={locked}
                  onChange={(_, next) =>
                    saveFields({ labels: [...new Set(next.map((label) => label.trim()).filter(Boolean))] })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={task.labels?.length ? "" : canEdit ? "Add labels" : "None"}
                      error={Boolean(errors.labels)}
                      helperText={errors.labels}
                    />
                  )}
                />
              </DetailRow>
              <DetailRow id="task-estimate" label="Story points">
                <FormField
                  id="task-estimate"
                  type="number"
                  value={estimate ?? formatEstimate(task.estimate)}
                  disabled={locked}
                  placeholder={canEdit ? "Add an estimate" : "None"}
                  error={Boolean(errors.estimate)}
                  helperText={errors.estimate}
                  onChange={(e) => {
                    setEstimate(e.target.value);
                    clearError("estimate");
                  }}
                  onBlur={saveEstimate}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                />
              </DetailRow>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 2, px: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Created {new Date(task.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Updated {new Date(task.updatedAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={deleteTaskMessage(task)}
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

      {confirmDone && (
        <OpenSubtasksDialog
          task={task}
          columnName={doneColumn?.name}
          loading={save.submitting}
          onConfirm={moveToDoneAnyway}
          onClose={() => setConfirmDone(null)}
        />
      )}
    </Box>
  );
};

// /workspaces/:workspaceSlug/projects/:projectId/tasks/:taskId
// The project and workspace come from the guards. It sits outside ProjectPage (no header or tabs), so it checks
// the work access and the archived state itself. Loads the task plus what the board loads (loadWork): the columns,
// the members to name the assignee, and the tasks for the project's labels. A subtask (`parentTaskId`) also loads
// its parent and gets its own, smaller view (SubtaskView).
const TaskPage = () => {
  const { taskId } = useParams();
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const workspaceArchived = isWorkspaceArchived(workspace);
  const projectArchived = isProjectArchived(project);
  const canEdit = !workspaceArchived && !projectArchived && can(project, PERMISSIONS.EDIT_TASKS);

  const state = useAsync(
    async (signal) => {
      const [task, work] = await Promise.all([getTask(project.id, taskId, signal), loadWork(project, "board", signal)]);
      const parent = task.parentTaskId == null ? null : await getTask(project.id, task.parentTaskId, signal);
      return { task, parent, columns: work.columns, members: work.members, labels: projectLabels(work.tasks) };
    },
    [project.id, taskId],
    { enabled: canView, fallback: "Couldn't load the task. Please try again.", messages: TASK_ERROR_MESSAGES },
  );

  if (!canView) {
    return (
      <PageLayout>
        <NoWorkAccess />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {(workspaceArchived || projectArchived) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {workspaceArchived
            ? "This workspace is archived. Projects are read-only."
            : "This project is archived. Restore it from Project settings to make changes."}
        </Alert>
      )}
      {state.data?.parent ? (
        <SubtaskView
          key={state.data.task.id}
          workspace={workspace}
          project={project}
          initialTask={state.data.task}
          parent={state.data.parent}
          columns={state.data.columns}
          members={state.data.members}
          canEdit={canEdit}
        />
      ) : state.data ? (
        <TaskView
          key={state.data.task.id}
          workspace={workspace}
          project={project}
          initialTask={state.data.task}
          columns={state.data.columns}
          members={state.data.members}
          labels={state.data.labels}
          canEdit={canEdit}
        />
      ) : (
        <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={6} />
        </Paper>
      )}
    </PageLayout>
  );
};

export default TaskPage;

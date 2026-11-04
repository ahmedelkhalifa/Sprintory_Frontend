import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import FormField from "../../forms/FormField";
import ConfirmDialog from "../../general/ConfirmDialog";
import AssigneePicker from "../AssigneePicker";
import DetailRow from "../DetailRow";
import TaskActivity from "../TaskActivity";
import TaskStatusSelect from "../TaskStatusSelect";
import TaskTitleField from "../TaskTitleField";
import { deleteTask, updateSubtask } from "../../../api/tasksApi";
import { useSubmit } from "../../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES, TASK_TYPES } from "../../../constants/tasks";
import { projectPath } from "../../../utils/project";
import { formatMinutes, subtaskChanges, subtaskValues, taskPath } from "../../../utils/task";
import { validateSubtask } from "../../../utils/validation";

// A subtask's own page, opened from its parent's list (like a Jira child issue): only what a subtask has, i.e. its
// title, status, assignee and time estimate in minutes, each saved on its own with the subtask endpoint (the task
// PATCH would read `estimate` as story points). No description, type, priority, labels or subtasks (one level only).
// `parent` is its parent task, for the way back; deleting the subtask goes there too.
const SubtaskView = ({ workspace, project, initialTask, parent, columns, members, canEdit }) => {
  const navigate = useNavigate();
  const [task, setTask] = useState(initialTask);
  const [errors, setErrors] = useState({});
  const [minutes, setMinutes] = useState(null); // the typed time, until it's saved
  const [people, setPeople] = useState(members);
  const [menu, setMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSubmit(TASK_ERROR_MESSAGES);
  const remove = useSubmit(TASK_ERROR_MESSAGES);
  const locked = !canEdit || save.submitting;
  const parentPath = taskPath(workspace, project, parent.id);
  const parentType = TASK_TYPES[parent.type];

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // `patch` = the edited field(s); { ok } when the subtask now has them, `invalid` when a field error is showing
  const saveFields = async (patch) => {
    const fields = Object.keys(patch);
    const values = { ...subtaskValues(task), ...patch };
    const found = validateSubtask(values);
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(fields.map((field) => [field, found[field] ?? ""])) }));
    if (fields.some((field) => found[field])) return { ok: false, invalid: true };

    const changes = subtaskChanges(task, values);
    if (Object.keys(changes).length === 0) return { ok: true };
    const { ok, result, error } = await save.run(() => updateSubtask(project.id, parent.id, task.id, changes));
    if (ok) {
      setTask(result);
      return { ok: true };
    }
    const data = error.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
      setErrors((prev) => ({ ...prev, ...data.fieldErrors }));
      save.clearError();
      return { ok: false, invalid: true };
    }
    return { ok: false };
  };

  const saveMinutes = async () => {
    if (minutes === null) return;
    const { ok, invalid } = await saveFields({ estimateMinutes: minutes.trim() });
    // keep an invalid value to fix; after a refusal show the subtask's time again
    if (ok || !invalid) setMinutes(null);
  };

  const saveAssignee = (member) => {
    if (member && !people.some((person) => person.userId === member.userId)) setPeople((prev) => [...prev, member]);
    saveFields({ assigneeId: member?.userId ?? null });
  };

  const handleDelete = async () => {
    const { ok } = await remove.run(() => deleteTask(project.id, task.id));
    if (ok) navigate(parentPath, { replace: true });
  };

  const assignee =
    task.assigneeId == null ? null : (people.find((m) => m.userId === task.assigneeId) ?? { userId: task.assigneeId });

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1.5 }}>
        <Link component={RouterLink} to={projectPath(workspace, project)} underline="hover" color="inherit">
          {project.name}
        </Link>
        <Link
          component={RouterLink}
          to={parentPath}
          underline="hover"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
        >
          {parentType && <parentType.Icon fontSize="small" sx={{ color: parentType.tone }} />}
          {parent.key}
        </Link>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.primary" }}>
          <AccountTreeOutlinedIcon fontSize="small" sx={{ color: "info.main" }} />
          <Typography>{task.key}</Typography>
        </Box>
      </Breadcrumbs>

      {save.error && (
        <Alert severity="error" onClose={save.clearError} sx={{ mb: 2 }}>
          {save.error}
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
        {/* left: where it belongs, the title and the activity */}
        <Box>
          <Link
            component={RouterLink}
            to={parentPath}
            underline="hover"
            color="text.secondary"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 1, fontSize: 14, maxWidth: "100%" }}
          >
            <SubdirectoryArrowRightRoundedIcon fontSize="small" sx={{ transform: "scaleY(-1)" }} />
            <Box component="span" sx={{ flexShrink: 0 }}>
              Subtask of {parent.key}
            </Box>
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              · {parent.title}
            </Box>
          </Link>
          <TaskTitleField
            title={task.title}
            canEdit={canEdit}
            error={errors.title}
            onEdit={() => clearError("title")}
            onSave={(title) => saveFields({ title })}
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
                    Delete subtask
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
              <DetailRow id="subtask-assignee" label="Assignee">
                <AssigneePicker
                  id="subtask-assignee"
                  label={null}
                  projectId={project.id}
                  value={assignee}
                  onChange={saveAssignee}
                  disabled={locked}
                />
              </DetailRow>
              <DetailRow id="subtask-time" label="Time (min)">
                <FormField
                  id="subtask-time"
                  type="number"
                  value={minutes ?? String(task.estimateMinutes ?? "")}
                  disabled={locked}
                  placeholder={canEdit ? "e.g. 90" : "None"}
                  error={Boolean(errors.estimateMinutes)}
                  helperText={errors.estimateMinutes || formatMinutes(minutes ?? task.estimateMinutes)}
                  onChange={(e) => {
                    setMinutes(e.target.value);
                    clearError("estimateMinutes");
                  }}
                  onBlur={saveMinutes}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
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
          title="Delete this subtask?"
          message={`${task.key} "${task.title}" will be deleted. This can't be undone.`}
          confirmLabel="Delete subtask"
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

export default SubtaskView;

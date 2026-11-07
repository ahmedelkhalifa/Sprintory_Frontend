import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, IconButton, Link, Popover, TextField, Tooltip, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import UserAvatar from "../../general/UserAvatar";
import AssigneePicker from "../AssigneePicker";
import TaskDeleteAction from "../TaskDeleteAction";
import { columnOptions } from "../columnOptions";
import { updateSubtask } from "../../../api/tasksApi";
import { useSubmit } from "../../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES, TASK_STAGES } from "../../../constants/tasks";
import { memberLabel } from "../../../utils/people";
import { findAssignee, formatMinutes, subtaskChanges, subtaskValues, taskPath, taskStage } from "../../../utils/task";

// the empty circle for "unassigned"
const NoAssignee = () => (
  <Box
    sx={{
      width: 26,
      height: 26,
      borderRadius: "50%",
      border: 1,
      borderStyle: "dashed",
      borderColor: "text.disabled",
      color: "text.disabled",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <PersonOutlineIcon sx={{ fontSize: 16 }} />
  </Box>
);

// One subtask in its parent's list, like a Jira child issue: key and title link to the subtask's own page; status and
// assignee change right here; then its time and "⋯" → Delete. Read-only without `canEdit`.
// `people` name the assignee (`onPersonPicked` adds someone picked from beyond the loaded members);
// `onChanged()` runs after a save or delete, so the list and the parent's progress reload.
const SubtaskRow = ({ workspace, project, parentId, subtask, columns, people, canEdit, onPersonPicked, onChanged }) => {
  const [picker, setPicker] = useState(null);
  const save = useSubmit(TASK_ERROR_MESSAGES);
  const locked = !canEdit || save.submitting;
  const path = taskPath(workspace, project, subtask.id);
  const assignee = findAssignee(subtask.assigneeId, people);
  const stage = TASK_STAGES[taskStage(subtask.statusId, columns)];
  const column = columns.find((c) => c.id === subtask.statusId);
  const time = formatMinutes(subtask.estimateMinutes);

  const saveField = async (patch) => {
    const changes = subtaskChanges(subtask, { ...subtaskValues(subtask), ...patch });
    if (Object.keys(changes).length === 0) return;
    const { ok } = await save.run(() => updateSubtask(project.id, parentId, subtask.id, changes));
    if (ok) onChanged();
  };

  const pickAssignee = (member) => {
    setPicker(null);
    if (member && !people.some((p) => p.userId === member.userId)) onPersonPicked(member);
    saveField({ assigneeId: member?.userId ?? null });
  };

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: { xs: "100%", sm: 0 } }}>
          <AccountTreeOutlinedIcon sx={{ fontSize: 16, color: "info.main", flexShrink: 0 }} aria-hidden />
          <Link
            component={RouterLink}
            to={path}
            underline="hover"
            color="text.secondary"
            sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          >
            {subtask.key}
          </Link>
          <Link
            component={RouterLink}
            to={path}
            underline="hover"
            color="text.primary"
            noWrap
            sx={{
              fontSize: 14,
              minWidth: 0,
              // done ones fade back, like Jira
              ...(stage.value === "DONE" && { color: "text.secondary", textDecoration: "line-through" }),
            }}
          >
            {subtask.title}
          </Link>
        </Box>

        {/* on phones this goes to a second line, kept to the right like on wide screens */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: { xs: "auto", sm: 0 } }}>
          {time && (
            <Tooltip title="Time estimate">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {time}
              </Typography>
            </Tooltip>
          )}

          <Tooltip title={assignee ? memberLabel(assignee) : "Unassigned"}>
            <span>
              <IconButton
                size="small"
                aria-label={`Assignee of ${subtask.key}`}
                disabled={locked}
                onClick={(e) => setPicker(e.currentTarget)}
                sx={{ p: 0.25, "&.Mui-disabled": { opacity: 1 } }}
              >
                {assignee ? <UserAvatar user={assignee} size={26} /> : <NoAssignee />}
              </IconButton>
            </span>
          </Tooltip>

          {canEdit ? (
            <TextField
              select
              size="small"
              value={subtask.statusId}
              disabled={locked}
              onChange={(e) => saveField({ statusId: e.target.value })}
              sx={{ width: 150, "& .MuiSelect-select": { py: 0.5, fontSize: 13 } }}
              slotProps={{ htmlInput: { "aria-label": `Status of ${subtask.key}` } }}
            >
              {columnOptions(columns)}
            </TextField>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, width: 150, fontSize: 13 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: stage.tone, flexShrink: 0 }} />
              <Typography variant="body2" noWrap sx={{ fontSize: 13 }}>
                {column?.name ?? subtask.statusName}
              </Typography>
            </Box>
          )}

          {canEdit && (
            <TaskDeleteAction
              projectId={project.id}
              // a list item may leave out its parent; the window should still say "subtask"
              task={{ ...subtask, parentTaskId: subtask.parentTaskId ?? parentId }}
              small
              onDeleted={onChanged}
            />
          )}
        </Box>
      </Box>

      {save.error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5, ml: 3 }}>
          {save.error}
        </Typography>
      )}

      <Popover
        open={Boolean(picker)}
        anchorEl={picker}
        onClose={() => setPicker(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { p: 1.5, width: 280 } } }}
      >
        <AssigneePicker
          id={`subtask-${subtask.id}-assignee`}
          label="Assignee"
          projectId={project.id}
          value={assignee}
          onChange={pickAssignee}
        />
      </Popover>
    </Box>
  );
};

export default SubtaskRow;

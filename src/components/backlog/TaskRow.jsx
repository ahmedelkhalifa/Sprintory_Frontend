import { memo, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, ButtonBase, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import ToneChip from "../general/ToneChip";
import UserAvatar from "../general/UserAvatar";
import { TASK_PRIORITIES, TASK_STAGES, TASK_TYPES } from "../../constants/tasks";
import { formatEstimate, labelTone } from "../../utils/task";
import { memberLabel } from "../../utils/people";
import { rowId } from "../tasks/dnd";

// the visible row: used in the lists and as the picture that follows the pointer while dragging.
// `task` comes from describeTasks (utils/task.js), so it has its `assignee` and `stage`
export const TaskRowContent = ({ task, handle, onOpen, actions, raised = false }) => {
  const type = TASK_TYPES[task.type] ?? TASK_TYPES.TASK;
  const priority = TASK_PRIORITIES[task.priority] ?? TASK_PRIORITIES.MEDIUM;
  const stage = TASK_STAGES[task.stage] ?? TASK_STAGES.TODO;
  const estimate = formatEstimate(task.estimate);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        minHeight: 48,
        pl: handle ? 0.5 : 2,
        pr: 1,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        ...(raised && { border: 1, borderColor: "primary.light", borderRadius: 1, boxShadow: 4 }),
        "&:hover": { bgcolor: raised ? "background.paper" : "action.hover" },
      }}
    >
      {handle}
      <Tooltip title={type.label}>
        <type.Icon fontSize="small" sx={{ color: type.tone, flexShrink: 0 }} aria-label={type.label} />
      </Tooltip>
      <Typography
        variant="body2"
        color="text.secondary"
        noWrap
        sx={{ width: 64, flexShrink: 0, fontWeight: 500, display: { xs: "none", sm: "block" } }}
      >
        {task.key}
      </Typography>
      <ButtonBase
        onClick={onOpen}
        sx={{ flex: 1, minWidth: 0, justifyContent: "flex-start", textAlign: "left", py: 1.25, borderRadius: 1 }}
      >
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
          {task.title}
        </Typography>
      </ButtonBase>

      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.75, flexShrink: 0 }}>
        {task.labels.slice(0, 2).map((label) => (
          <ToneChip key={label} label={label} tone={labelTone(label)} />
        ))}
        {task.labels.length > 2 && <ToneChip label={`+${task.labels.length - 2}`} />}
      </Box>
      <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
        <ToneChip label={task.statusName} tone={stage.tone} />
      </Box>
      <Tooltip title={`${priority.label} priority`}>
        <priority.Icon fontSize="small" sx={{ color: priority.tone, flexShrink: 0 }} aria-label={`${priority.label} priority`} />
      </Tooltip>
      <Tooltip title={estimate ? "Estimate" : "No estimate"}>
        <Box
          sx={{
            minWidth: 28,
            px: 0.75,
            py: 0.25,
            borderRadius: 3,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
            bgcolor: "background.default",
            color: estimate ? "text.primary" : "text.disabled",
          }}
        >
          {estimate || "–"}
        </Box>
      </Tooltip>
      {/* the Box holds the tooltip's ref, which UserAvatar doesn't pass on */}
      <Tooltip title={task.assignee ? memberLabel(task.assignee) : "Unassigned"}>
        <Box sx={{ display: "flex", flexShrink: 0 }}>
          {task.assignee ? (
            <UserAvatar user={task.assignee} size={26} />
          ) : (
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
          )}
        </Box>
      </Tooltip>
      {actions}
    </Box>
  );
};

// the row's "..." button and its menu: Open details plus the moves, asked from `getMoves` only while it's open
const RowActions = ({ task, sprintId, getMoves, onMove, onOpen }) => {
  const [anchor, setAnchor] = useState(null);
  const moves = anchor ? getMoves(task, sprintId) : [];

  const pick = (move) => {
    setAnchor(null);
    if (move) onMove(move);
    else onOpen(task.id);
  };

  return (
    <>
      <IconButton size="small" aria-label={`Actions for ${task.key}`} onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => pick(null)}>Open details</MenuItem>
        {moves.map((move) => (
          <MenuItem key={move.label} onClick={() => pick(move)}>
            {move.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// One task in the backlog or a sprint (`sprintId`, null = backlog). It can be dragged by its handle when `canDrag`;
// `getMoves(task, sprintId)` gives the same moves ({ label, sprintId, afterTaskId }) as menu items, for touch and
// keyboard users, and `onMove(move)` / `onOpen(taskId)` act on them. Memoized: the tab re-renders when a drag starts
// or crosses into another list, and a row only needs to when its own props change.
const TaskRow = ({ task, sprintId, canDrag, getMoves, onMove, onOpen }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId(task.id),
    disabled: !canDrag,
    data: { taskId: task.id },
  });

  // dnd-kit re-renders the dragged row on every pointer move (it reads the drag position from context);
  // none of these inputs change then, so the same element is reused and React skips the row's content
  const content = useMemo(
    () => (
      <TaskRowContent
        task={task}
        handle={
          canDrag ? (
            <IconButton
              ref={setActivatorNodeRef}
              size="small"
              aria-label={`Move ${task.key}`}
              sx={{ cursor: "grab", color: "text.disabled", "&:hover": { color: "text.secondary" } }}
              {...attributes}
              {...listeners}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          ) : null
        }
        onOpen={() => onOpen(task.id)}
        actions={<RowActions task={task} sprintId={sprintId} getMoves={getMoves} onMove={onMove} onOpen={onOpen} />}
      />
    ),
    [task, sprintId, canDrag, getMoves, onMove, onOpen, attributes, listeners, setActivatorNodeRef],
  );

  return (
    <Box
      ref={setNodeRef}
      // what changes while dragging goes in `style`, which skips the sx / Emotion work
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1, position: "relative" }}
    >
      {content}
    </Box>
  );
};

export default memo(TaskRow);

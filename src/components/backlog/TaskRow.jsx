import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, ButtonBase, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import ToneChip from "../general/ToneChip";
import UserAvatar from "../general/UserAvatar";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "../../constants/tasks";
import { formatEstimate, labelTone } from "../../utils/task";
import { memberLabel } from "../../utils/people";
import { rowId } from "./dnd";

// the visible row: used in the lists and as the picture that follows the pointer while dragging
export const TaskRowContent = ({ task, handle, onOpen, actions, raised = false }) => {
  const type = TASK_TYPES[task.type] ?? TASK_TYPES.TASK;
  const priority = TASK_PRIORITIES[task.priority] ?? TASK_PRIORITIES.MEDIUM;
  const status = TASK_STATUSES[task.status] ?? TASK_STATUSES.TODO;
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
        <ToneChip label={status.label} tone={status.tone} />
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

// One task in the backlog or a sprint. It can be dragged by its handle when `canDrag`;
// `moves` ({ label, sprintId, beforeTaskId }) are the same moves offered as menu items, for touch and keyboard users.
const TaskRow = ({ task, canDrag, moves, onMove, onOpen }) => {
  const [anchor, setAnchor] = useState(null);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId(task.id),
    disabled: !canDrag,
    data: { taskId: task.id },
  });

  const handle = canDrag ? (
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
  ) : null;

  const pick = (move) => {
    setAnchor(null);
    if (move) onMove(move);
    else onOpen();
  };

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      sx={{ opacity: isDragging ? 0.4 : 1, position: "relative" }}
    >
      <TaskRowContent
        task={task}
        handle={handle}
        onOpen={onOpen}
        actions={
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
        }
      />
    </Box>
  );
};

export default TaskRow;

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Tooltip, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import UserAvatar from "../general/UserAvatar";
import { TASK_PRIORITIES, TASK_TYPES } from "../../constants/tasks";
import { formatEstimate } from "../../utils/task";
import { memberLabel } from "../../utils/people";
import { rowId } from "../tasks/dnd";

// the visible card: used in the columns and as the picture that follows the pointer while dragging.
// `task` comes from describeTasks (utils/task.js), so it has its `assignee`
export const BoardCardContent = ({ task, raised = false, draggable = false }) => {
  const type = TASK_TYPES[task.type] ?? TASK_TYPES.TASK;
  const priority = TASK_PRIORITIES[task.priority] ?? TASK_PRIORITIES.MEDIUM;
  const estimate = formatEstimate(task.estimate);

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: "background.paper",
        border: 1,
        borderColor: raised ? "primary.light" : "divider",
        borderRadius: 1.5,
        boxShadow: raised ? 4 : 1,
        cursor: draggable ? "grab" : "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          overflowWrap: "anywhere",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.25 }}>
        <Tooltip title={type.label}>
          <type.Icon fontSize="small" sx={{ color: type.tone }} aria-label={type.label} />
        </Tooltip>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 600, flexGrow: 1 }}>
          {task.key}
        </Typography>
        <Tooltip title={`${priority.label} priority`}>
          <priority.Icon fontSize="small" sx={{ color: priority.tone }} aria-label={`${priority.label} priority`} />
        </Tooltip>
        {estimate && (
          <Tooltip title="Estimate">
            <Box
              sx={{
                minWidth: 24,
                px: 0.75,
                py: 0.25,
                borderRadius: 3,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 600,
                bgcolor: "background.default",
              }}
            >
              {estimate}
            </Box>
          </Tooltip>
        )}
        {/* the Box holds the tooltip's ref, which UserAvatar doesn't pass on */}
        <Tooltip title={task.assignee ? memberLabel(task.assignee) : "Unassigned"}>
          <Box sx={{ display: "flex" }}>
            {task.assignee ? (
              <UserAvatar user={task.assignee} size={24} />
            ) : (
              <Box
                sx={{
                  width: 24,
                  height: 24,
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
                <PersonOutlineIcon sx={{ fontSize: 15 }} />
              </Box>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

// One task on the board. The whole card is dragged when `canDrag`; a click (or Enter) opens it, Space picks it up
// with the keyboard.
const BoardCard = ({ task, canDrag, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId(task.id),
    disabled: !canDrag,
    data: { taskId: task.id },
  });

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onOpen();
    else listeners?.onKeyDown?.(e);
  };

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
      onClick={onOpen}
      tabIndex={0}
      role="button"
      aria-label={`${task.key} ${task.title}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      sx={{
        opacity: isDragging ? 0.4 : 1,
        borderRadius: 1.5,
        outline: "none",
        "&:focus-visible": { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}` },
      }}
    >
      <BoardCardContent task={task} draggable={canDrag} />
    </Box>
  );
};

export default BoardCard;

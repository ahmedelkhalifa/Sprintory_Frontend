import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { listId, rowId } from "../tasks/dnd";

// Card for one list (a sprint or the backlog): a tinted header, an optional white `toolbar` (e.g. quick add),
// then the white rows, which accept dropped tasks. `highlight` marks it as the place a dragged task will land.
// An empty list keeps its shape: a dashed area `emptyHeight` tall with `emptyText` and an optional `emptyAction`.
// `droppable` false makes it a placeholder that takes no drops (the sprint box before any sprint exists).
const TaskList = ({
  sprintId,
  tasks,
  header,
  toolbar,
  highlight,
  emptyText,
  emptyAction,
  emptyHeight = 192,
  droppable = true,
  children,
}) => {
  const { setNodeRef } = useDroppable({ id: listId(sprintId), data: { list: true, sprintId }, disabled: !droppable });

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        boxShadow: highlight ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` : 1,
        borderRadius: 2,
        overflow: "hidden",
        transition: "border-color 0.15s, box-shadow 0.15s",
      })}
    >
      {/* a faint slate tint from the text color, so it stays neutral next to the white rows */}
      <Box sx={(theme) => ({ bgcolor: alpha(theme.palette.text.primary, 0.04) })}>{header}</Box>
      {toolbar && <Box sx={{ borderTop: 1, borderColor: "divider" }}>{toolbar}</Box>}
      <SortableContext items={tasks.map((task) => rowId(task.id))} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} sx={{ minHeight: 56, borderTop: 1, borderColor: "divider" }}>
          {tasks.length === 0 ? (
            <Box sx={{ p: 1.5 }}>
              <Box
                sx={{
                  minHeight: emptyHeight,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  px: 2,
                  textAlign: "center",
                  border: "1.5px dashed",
                  borderColor: highlight ? "primary.main" : "divider",
                  borderRadius: 1.5,
                  bgcolor: highlight ? "action.hover" : "transparent",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                <InboxOutlinedIcon sx={{ fontSize: 32, color: "text.disabled" }} />
                <Typography variant="body2" color="text.secondary">
                  {emptyText}
                </Typography>
                {emptyAction}
              </Box>
            </Box>
          ) : (
            children
          )}
        </Box>
      </SortableContext>
    </Paper>
  );
};

export default TaskList;

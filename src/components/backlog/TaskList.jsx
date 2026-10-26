import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { listId, rowId } from "./dnd";

// Card for one list (a sprint or the backlog): a tinted header, an optional white `toolbar` (e.g. quick add),
// then the white rows, which accept dropped tasks. `highlight` marks it as the place a dragged task will land.
const TaskList = ({ sprintId, tasks, header, toolbar, highlight, emptyText, children }) => {
  const { setNodeRef } = useDroppable({ id: listId(sprintId), data: { list: true, sprintId } });

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
            <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 2, textAlign: "center" }}>
              {emptyText}
            </Typography>
          ) : (
            children
          )}
        </Box>
      </SortableContext>
    </Paper>
  );
};

export default TaskList;

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ToneChip from "../general/ToneChip";
import { overWip } from "../../utils/board";
import { columnListId, rowId } from "../tasks/dnd";

// the width of one column; the board scrolls sideways when they don't fit
export const COLUMN_WIDTH = 280;

// One board column: its name, how many tasks it holds (against its WIP limit, if it has one), then its cards,
// which accept dropped tasks. `highlight` marks it as the place a dragged task will land.
const BoardColumn = ({ column, highlight, emptyText, menu, children }) => {
  const { setNodeRef } = useDroppable({ id: columnListId(column.id), data: { column: true, statusId: column.id } });
  const count = column.tasks.length;
  const over = overWip(column, count);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        width: COLUMN_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        boxShadow: highlight ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` : 1,
        borderRadius: 2,
        overflow: "hidden",
        // the cards sit on the same faint slate as the backlog's headers, so white cards stand out
        bgcolor: alpha(theme.palette.text.primary, 0.03),
        transition: "border-color 0.15s, box-shadow 0.15s",
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <Typography component="h3" noWrap sx={{ fontWeight: 700, fontSize: 14, flexGrow: 1, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {column.name}
        </Typography>
        {column.wipLimit != null ? (
          <Tooltip title={over ? `Over the work-in-progress limit of ${column.wipLimit}` : "Tasks / work-in-progress limit"}>
            <Box component="span" sx={{ display: "inline-flex" }}>
              <ToneChip label={`${count} / ${column.wipLimit}`} tone={over ? "error.main" : "text.secondary"} />
                {menu}
            </Box>
          </Tooltip>
        ) : (
          <ToneChip label={count} tone="text.secondary" />
        )}
      </Box>

      <SortableContext items={column.tasks.map((task) => rowId(task.id))} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1, minHeight: 120, flexGrow: 1 }}>
          {count === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ px: 1, py: 3, textAlign: "center" }}>
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

export default BoardColumn;

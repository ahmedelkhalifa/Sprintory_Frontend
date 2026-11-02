import { Box, MenuItem } from "@mui/material";
import { TASK_STAGES } from "../../constants/tasks";
import { taskStage } from "../../utils/task";

// the status select's options: the board's columns, each with the dot color of its stage
export const columnOptions = (columns) =>
  columns.map((column) => (
    <MenuItem key={column.id} value={column.id}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: TASK_STAGES[taskStage(column.id, columns)].tone }} />
        {column.name}
      </Box>
    </MenuItem>
  ));

import { Box } from "@mui/material";
import { TASK_STAGES } from "../../constants/tasks";

// a project's tasks per stage as one stacked bar, in board order (`board` is a boardSummary from utils/myWork.js;
// the counts are written next to it, so the bar itself is hidden from screen readers). An empty board keeps a plain
// gray track.
const StageBar = ({ board }) => (
  <Box aria-hidden="true" sx={{ display: "flex", gap: "2px", height: 6, bgcolor: board.total ? "transparent" : "action.selected" }}>
    {Object.values(TASK_STAGES)
      .filter((stage) => board[stage.value] > 0)
      .map((stage) => (
        <Box key={stage.value} sx={{ flexGrow: board[stage.value], bgcolor: stage.bar, borderRadius: "1px" }} />
      ))}
  </Box>
);

export default StageBar;

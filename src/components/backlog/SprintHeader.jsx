import { useState } from "react";
import { Box, Button, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ToneChip from "../general/ToneChip";
import { SPRINT_STATUS } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { formatEstimate, sumEstimates } from "../../utils/task";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// "Oct 25, 2026 – Nov 8, 2026", or a hint while a planned sprint has no dates
const sprintDates = (sprint) =>
  sprint.startDate && sprint.endDate ? `${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}` : "No dates yet";

// The estimate total next to the capacity; amber once the planned work is more than the capacity
export const EstimateSummary = ({ tasks, capacity = null }) => {
  const total = sumEstimates(tasks);
  const over = capacity !== null && total > capacity;
  const label = capacity === null ? formatEstimate(total) : `${formatEstimate(total)} / ${formatEstimate(capacity)}`;
  const hint = capacity === null ? "Estimate total" : over ? `Over capacity by ${formatEstimate(total - capacity)}` : "Estimate total / capacity";

  return (
    <Tooltip title={hint}>
      <Box component="span" sx={{ display: "inline-flex" }}>
        <ToneChip label={label} tone={over ? "warning.main" : "text.secondary"} />
      </Box>
    </Tooltip>
  );
};

// Top of a sprint card: name, status, dates, size, goal; for planners Start sprint and Edit / Delete.
// `startBlocked` is true while another sprint is active (only one can run at a time).
const SprintHeader = ({ sprint, canPlan, startBlocked, onStart, onEdit, onDelete }) => {
  const [anchor, setAnchor] = useState(null);
  const status = SPRINT_STATUS[sprint.status] ?? SPRINT_STATUS.PLANNED;
  const planned = sprint.status === "PLANNED";

  const pick = (action) => {
    setAnchor(null);
    action();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.25, rowGap: 0.5 }}>
          <Typography component="h3" sx={{ fontWeight: 700, fontSize: 16 }}>
            {sprint.name}
          </Typography>
          <ToneChip label={status.label} tone={status.tone} dot />
          <Typography variant="body2" color="text.secondary">
            {sprintDates(sprint)} · {plural(sprint.tasks.length, "task")}
          </Typography>
        </Box>
        {sprint.goal && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
              Goal:
            </Box>{" "}
            {sprint.goal}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <EstimateSummary tasks={sprint.tasks} capacity={sprint.capacity} />
        {canPlan && planned && (
          <Tooltip title={startBlocked ? "Another sprint is already active" : ""}>
            <span>
              <Button size="small" variant="contained" disabled={startBlocked} onClick={onStart}>
                Start sprint
              </Button>
            </span>
          </Tooltip>
        )}
        {canPlan && (
          <>
            <IconButton size="small" aria-label={`Actions for ${sprint.name}`} onClick={(e) => setAnchor(e.currentTarget)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={() => setAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={() => pick(onEdit)}>Edit sprint</MenuItem>
              {planned && (
                <MenuItem onClick={() => pick(onDelete)} sx={{ color: "error.main" }}>
                  Delete sprint
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
};

export default SprintHeader;

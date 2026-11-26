import { Box, Tooltip, Typography } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { blockedTooltip, openBlockersOf } from "../../../utils/dependency";

// the tooltip: a heading and one line per open blocker ("PMP-10 Build API · In Progress")
const BlockersList = ({ blockers }) => (
  <Box sx={{ py: 0.25 }}>
    <Typography variant="caption" sx={{ display: "block", fontWeight: 700, mb: 0.25 }}>
      {blockers.length === 1 ? "Blocked by" : `Blocked by ${blockers.length} tasks`}
    </Typography>
    {blockers.map((blocker) => (
      <Typography key={blocker.id} variant="caption" component="div" sx={{ overflowWrap: "anywhere" }}>
        <Box component="span" sx={{ fontWeight: 700 }}>
          {blocker.key}
        </Box>{" "}
        {blocker.title}
        {blocker.statusName && ` · ${blocker.statusName}`}
      </Typography>
    ))}
  </Box>
);

// The Blocked icon on a board card or a backlog row (PMP-45): shown while the task has an open blocker, with the
// open blockers in its tooltip. Everything comes from the task response's `blocked` / `openBlockers`, so the lists
// need no request per task. Nothing for a task that isn't blocked.
const BlockedMark = ({ task, size = 18 }) => {
  const blockers = openBlockersOf(task);
  if (blockers.length === 0) return null;

  return (
    <Tooltip title={<BlockersList blockers={blockers} />}>
      <Box
        component="span"
        role="img"
        aria-label={blockedTooltip(blockers)}
        // a click on the mark still opens the task like the rest of the card
        sx={{ display: "inline-flex", alignItems: "center", color: "error.main", flexShrink: 0 }}
      >
        <BlockIcon sx={{ fontSize: size }} />
      </Box>
    </Tooltip>
  );
};

export default BlockedMark;

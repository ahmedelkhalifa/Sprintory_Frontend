import { Box, Paper, Popper, Stack, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import StageIcon from "./StageIcon";
import { dayNumber } from "../../utils/schedule";
import { formatDate } from "../../utils/format";

const LINE_SX = { display: "flex", alignItems: "center", gap: 0.75 };

// the conflicts' messages, in red with a warning icon
const Conflicts = ({ messages }) =>
  messages.map((message) => (
    <Box key={message} sx={{ ...LINE_SX, alignItems: "flex-start", color: "error.main" }}>
      <WarningAmberRoundedIcon sx={{ fontSize: 16, mt: 0.125 }} />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {message}
      </Typography>
    </Box>
  ));

// what a bar is about: key and title, dates and length, status, assignee, milestone, conflicts
const TaskDetails = ({ task, conflicts, milestone }) => {
  const days = dayNumber(task.dueDate) - dayNumber(task.startDate) + 1;
  return (
    <Stack spacing={0.75}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {task.key} {task.title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatDate(task.startDate)} – {formatDate(task.dueDate)} · {days} {days === 1 ? "day" : "days"}
      </Typography>
      <Box sx={LINE_SX}>
        <StageIcon category={task.statusCategory} statusName={task.statusName} size={14} />
        <Typography variant="caption">{task.statusName}</Typography>
        <Typography variant="caption" color="text.secondary">
          · {task.assignee ?? "Unassigned"}
        </Typography>
      </Box>
      {milestone && (
        <Typography variant="caption" color="text.secondary">
          Milestone: {milestone.name} ({formatDate(milestone.targetDate)})
        </Typography>
      )}
      <Conflicts messages={conflicts} />
      <Typography variant="caption" color="text.disabled">
        Click to open it in a new tab
      </Typography>
    </Stack>
  );
};

const MilestoneDetails = ({ milestone, conflicts }) => (
  <Stack spacing={0.75}>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>
      {milestone.name}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Milestone · {formatDate(milestone.targetDate)}
    </Typography>
    <Conflicts messages={conflicts} />
  </Stack>
);

/**
 * The one hover card of the Timeline (instead of a tooltip per bar, which 500 rows would pay for): `hover` is
 * { anchor, task, conflicts } for a bar or { anchor, milestone, conflicts } for a diamond, or null. It doesn't take
 * the pointer, so moving along the bars never flickers.
 */
const TimelineHoverCard = ({ hover, milestones }) => {
  const milestone = hover?.task?.milestoneId == null ? null : milestones.find((m) => m.id === hover.task.milestoneId);
  return (
    <Popper
      open={Boolean(hover)}
      anchorEl={hover?.anchor}
      placement="top-start"
      modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
      sx={{ zIndex: "tooltip", pointerEvents: "none" }}
    >
      {hover && (
        <Paper elevation={0} sx={{ p: 1.5, maxWidth: 340, border: 1, borderColor: "divider", borderRadius: 2 }}>
          {hover.task ? (
            <TaskDetails task={hover.task} conflicts={hover.conflicts} milestone={milestone} />
          ) : (
            <MilestoneDetails milestone={hover.milestone} conflicts={hover.conflicts} />
          )}
        </Paper>
      )}
    </Popper>
  );
};

export default TimelineHoverCard;

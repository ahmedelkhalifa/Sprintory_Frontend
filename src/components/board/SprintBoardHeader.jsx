import { Box, Button, LinearProgress, Paper, Typography } from "@mui/material";
import ToneChip from "../general/ToneChip";
import { SPRINT_STATUS } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { daysLeft, sprintProgress } from "../../utils/board";
import { formatEstimate } from "../../utils/task";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// "5 days left" or "Last day" (the end date counts as a day of the sprint); "" once it's past
const timeLeft = (endDate) => {
  const days = daysLeft(endDate);
  if (!days) return "";
  return days === 1 ? "Last day" : `${days} days left`;
};

// Above the Scrum board: the active sprint's name, dates, time left (or "Past end date") and goal, how much of it is
// done (by estimate, or by task count while nothing is estimated), and the buttons that end it: Complete sprint for
// the Scrum Master (`canComplete`, MANAGE_SPRINTS), Cancel sprint for the Product Owner / Project Manager (`canCancel`,
// CANCEL_SPRINTS). `overdue` is the board's `activeSprint.overdue` (the backend counts days in UTC); without it the
// end date decides.
const SprintBoardHeader = ({
  sprint,
  tasks,
  columns,
  overdue,
  canComplete = false,
  canCancel = false,
  onCompleteSprint,
  onCancelSprint,
}) => {
  const progress = sprintProgress(tasks, columns);
  const byEstimate = progress.totalEstimate > 0;
  const done = byEstimate ? progress.doneEstimate : progress.doneCount;
  const total = byEstimate ? progress.totalEstimate : progress.totalCount;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const pastEnd = overdue ?? daysLeft(sprint.endDate) === 0;
  const left = pastEnd ? "" : timeLeft(sprint.endDate);

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: { xs: 2, md: 4 },
        px: { xs: 2, sm: 2.5 },
        py: 2,
        mb: 2.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Box sx={{ flex: "1 1 320px", minWidth: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.25, rowGap: 0.5 }}>
          <Typography component="h2" sx={{ fontWeight: 700, fontSize: 18 }}>
            {sprint.name}
          </Typography>
          <ToneChip label={SPRINT_STATUS.ACTIVE.label} tone={SPRINT_STATUS.ACTIVE.tone} dot />
          {/* still active after its end date: the Scrum Master gets a daily reminder to close it */}
          {pastEnd && <ToneChip label="Past end date" tone="warning.main" />}
          <Typography variant="body2" color="text.secondary">
            {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            {left && (
              <>
                {" · "}
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                  {left}
                </Box>
              </>
            )}
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

      <Box sx={{ flex: "1 1 220px", maxWidth: { md: 320 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {percent}% done
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {byEstimate
              ? `${formatEstimate(done)} of ${formatEstimate(total)} points`
              : `${done} of ${plural(total, "task")}`}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percent}
          color="success"
          aria-label="Sprint progress"
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {(canComplete || canCancel) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
          {canCancel && (
            <Button variant="outlined" color="error" onClick={onCancelSprint}>
              Cancel sprint
            </Button>
          )}
          {canComplete && (
            <Button variant="contained" onClick={onCompleteSprint}>
              Complete sprint
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default SprintBoardHeader;

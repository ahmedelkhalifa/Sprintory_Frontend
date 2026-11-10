import { Box, Paper, Stack, Typography } from "@mui/material";
import ToneChip from "../general/ToneChip";
import { SPRINT_STATUS } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { goalAchievedLabel, isSprintEnded } from "../../utils/sprint";
import { formatEstimate } from "../../utils/task";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// a number on top of a short label
const Stat = ({ value, label, tone = "text.primary" }) => (
  <Box sx={{ flex: "1 1 160px", p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 22, color: tone }}>{value}</Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

// a labelled block of text the team wrote (the goal, the close note, the cancel reason), kept as typed
const Written = ({ label, children }) => (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {children}
    </Typography>
  </Box>
);

// What a sprint saved when it ended (PMP-41, sprints-docs §2), from a SprintResponse: status, planned dates and when
// it ended, the frozen points (done, carried over, committed at the start), and the Scrum Master's goal answer and
// note for a close, or the reason for a cancel. Only draws: the page around it loads the sprint.
const SprintSummary = ({ sprint }) => {
  const status = SPRINT_STATUS[sprint.status] ?? SPRINT_STATUS.PLANNED;
  const ended = isSprintEnded(sprint);
  const cancelled = sprint.status === "CANCELLED";
  // after the end a sprint's taskIds are its done items; the unfinished ones moved on
  const doneItems = sprint.taskIds?.length ?? 0;

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Stack spacing={2.5}>
        <Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.25, rowGap: 0.5 }}>
            <Typography component="h2" sx={{ fontWeight: 700, fontSize: 20, overflowWrap: "anywhere" }}>
              {sprint.name}
            </Typography>
            <ToneChip label={status.label} tone={status.tone} dot />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {sprint.startDate && sprint.endDate
              ? `Planned ${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`
              : "No dates yet"}
            {sprint.completedAt && ` · ${cancelled ? "Cancelled" : "Completed"} on ${formatDate(sprint.completedAt)}`}
          </Typography>
        </Box>

        {ended ? (
          <>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Stat
                value={formatEstimate(sprint.completedPoints ?? 0)}
                label={`points done · ${plural(doneItems, "item")}`}
                tone="success.main"
              />
              <Stat
                value={formatEstimate(sprint.unfinishedPoints ?? 0)}
                label="points carried over"
                tone={sprint.unfinishedPoints > 0 ? "warning.main" : "text.primary"}
              />
              <Stat value={formatEstimate(sprint.committedPoints ?? 0)} label="points committed at the start" />
            </Box>
            {cancelled && (
              <Typography variant="body2" color="text.secondary">
                A cancelled sprint doesn't count toward velocity, so it doesn't change the capacity suggestion.
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            This sprint hasn't ended yet. Its result shows here once it's completed or cancelled.
          </Typography>
        )}

        {sprint.goal && <Written label="Sprint Goal">{sprint.goal}</Written>}

        {sprint.status === "COMPLETED" && (
          <Written label={`Goal achieved: ${goalAchievedLabel(sprint.goalAchieved) || "not recorded"}`}>
            {sprint.goalNote || "No note."}
          </Written>
        )}
        {cancelled && <Written label="Reason for cancelling">{sprint.cancelReason || "No reason recorded."}</Written>}
      </Stack>
    </Paper>
  );
};

export default SprintSummary;

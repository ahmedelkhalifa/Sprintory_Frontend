import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Paper, Stack, Typography } from "@mui/material";
import ToneChip from "../general/ToneChip";
import Written from "../sprints/Written";
import { RETRO_STATUS } from "../../constants/retro";
import { formatDate } from "../../utils/format";
import { goalAchievedLabel, sprintPath } from "../../utils/sprint";

const by = (person) => (person ? ` by ${person.name}` : "");

// The top of a retro's page: its title and status, and how its sprint ended (the goal with the Scrum Master's answer
// and note, or why it was cancelled), so the team remembers what it's talking about. `actions` are its buttons, in the
// top right corner.
const RetroHeader = ({ retro, workspace, project, actions }) => {
  const { sprint } = retro;
  const status = RETRO_STATUS[retro.status] ?? RETRO_STATUS.OPEN;
  const cancelled = sprint.status === "CANCELLED";

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.25, rowGap: 0.5 }}>
              <Typography variant="h5" component="h2" sx={{ overflowWrap: "anywhere" }}>
                {retro.title}
              </Typography>
              <ToneChip label={status.label} tone={status.tone} dot />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
              <Link component={RouterLink} to={sprintPath(workspace, project, sprint.id)} underline="hover">
                {sprint.name}
              </Link>
              {sprint.startDate && sprint.endDate && ` · ${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`}
              {sprint.completedAt && ` · ${cancelled ? "Cancelled" : "Completed"} on ${formatDate(sprint.completedAt)}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`Opened on ${formatDate(retro.createdAt)}${by(retro.createdBy)}`}
              {retro.closedAt && ` · Closed on ${formatDate(retro.closedAt)}${by(retro.closedBy)}`}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>
        </Box>

        {sprint.goal && <Written label="Sprint Goal">{sprint.goal}</Written>}
        {cancelled ? (
          <Written label="Reason for cancelling">{sprint.cancelReason || "No reason recorded."}</Written>
        ) : (
          <Written label={`Goal achieved: ${goalAchievedLabel(sprint.goalAchieved) || "not recorded"}`}>
            {sprint.goalNote || "No note."}
          </Written>
        )}
      </Stack>
    </Paper>
  );
};

export default RetroHeader;

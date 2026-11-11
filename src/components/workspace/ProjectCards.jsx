import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Paper, Skeleton, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import ProjectAvatar from "../projects/ProjectAvatar";
import TemplateChip from "../projects/TemplateChip";
import { projectPath, projectTabPath, projectsPath } from "../../utils/project";
import { sprintDays, sprintDaysText } from "../../utils/myWork";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";

// two wide cards per row, like Jira's recent projects; the full list is the Projects page
const MAX_CARDS = 4;

// the bar's stages in board order; to do stays neutral, colour is for work moving and work done
const STAGES = [
  { key: "TODO", word: "to do", color: "text.disabled" },
  { key: "IN_PROGRESS", word: "in progress", color: "info.main" },
  { key: "DONE", word: "done", color: "success.main" },
];

const cardSx = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
  px: { xs: 2, sm: 2.5 },
  py: 2,
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  transition: "border-color 120ms ease-out",
  "@media (hover: hover)": { "&:hover": { borderColor: "text.disabled" } },
};

// the board's tasks per stage as one stacked bar (the counts are written beside the status line);
// an empty board keeps a plain gray track, so every card has the same rows
const StageBar = ({ board }) => (
  <Box aria-hidden="true" sx={{ display: "flex", gap: "2px", height: 6, bgcolor: board.total ? "transparent" : "action.selected" }}>
    {STAGES.filter((stage) => board[stage.key] > 0).map((stage) => (
      <Box key={stage.key} sx={{ flexGrow: board[stage.key], bgcolor: stage.color, borderRadius: "1px" }} />
    ))}
  </Box>
);

const countsText = (board) =>
  board.total === 0 ? "No tasks yet" : STAGES.map((stage) => `${board[stage.key]} ${stage.word}`).join(" · ");

// what the project's method watches: Scrum the running sprint, Kanban the WIP limits
const statusLine = ({ board, sprint, sprintsEnabled, wipLimitsEnabled }) => {
  if (sprintsEnabled) {
    if (!sprint) return { text: "No active sprint" };
    const days = sprintDays(sprint);
    return { text: [sprint.name, sprintDaysText(days)].filter(Boolean).join(" · "), warn: days?.overdue > 0 };
  }
  if (board.overLimit.length > 0) {
    const names = board.overLimit.join(", ");
    return { text: `${names} ${board.overLimit.length === 1 ? "is" : "are"} over the WIP limit`, warn: true };
  }
  return wipLimitsEnabled ? { text: "Within WIP limits" } : null;
};

const ProjectCard = ({ summary, workspace }) => {
  const { project, backlogEnabled } = summary;
  const status = statusLine(summary);

  return (
    <Paper elevation={0} sx={cardSx}>
      {/* wide card: who it is on the left, where to go on the right */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <ProjectAvatar project={project} size={36} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Link
            component={RouterLink}
            to={projectPath(workspace, project)}
            color="text.primary"
            noWrap
            sx={{ display: "block", fontWeight: 600 }}
          >
            {project.name}
          </Link>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {project.key}
            </Typography>
            <TemplateChip template={project.template} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <Link component={RouterLink} to={projectTabPath(workspace, project, "board")} variant="body2">
            Board
          </Link>
          {backlogEnabled && (
            <Link component={RouterLink} to={projectTabPath(workspace, project, "backlog")} variant="body2">
              Backlog
            </Link>
          )}
        </Box>
      </Box>

      <Box>
        <StageBar board={summary.board} />
        {/* the counts on the left, the method's status on the right; they stack when the card is narrow */}
        <Box
          sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", columnGap: 2, rowGap: 0.5, mt: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            {countsText(summary.board)}
          </Typography>
          {status && (
            <Typography variant="body2" sx={{ color: status.warn ? "warning.main" : "text.secondary", minWidth: 0 }}>
              {status.text}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// none of the caller's: either the workspace has no projects, or they aren't in any (the full list is "View all")
const emptyText = (workspaceTotal) =>
  workspaceTotal > 0
    ? "You're not in any of this workspace's projects yet. View all projects to see them."
    : "No projects yet. A project holds its board, backlog, sprints, charter and chat.";

// the projects the caller works in (from useMyWork), the home page's project list.
// workspaceTotal: how many projects the workspace has, for the empty text
const ProjectCards = ({ projects, loading, workspaceTotal }) => {
  const { workspace } = useWorkspaceAccess();
  // a failed load already shows its error and retry in Assigned to me, from the same request
  if (!loading && !projects) return null;
  const empty = !loading && projects.length === 0;

  return (
    <Box component="section" aria-labelledby="your-projects">
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
        <Typography id="your-projects" variant="h6" component="h2">
          Your projects
        </Typography>
        <Link
          component={RouterLink}
          to={projectsPath(workspace)}
          variant="body2"
          sx={{ display: "inline-flex", alignItems: "center", fontWeight: 500 }}
        >
          View all projects <ChevronRight fontSize="small" />
        </Link>
      </Box>
      {empty ? (
        <Paper elevation={0} sx={{ px: { xs: 2, sm: 2.5 }, py: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {emptyText(workspaceTotal)}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}
        >
          {loading
            ? [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={118} />)
            : projects.slice(0, MAX_CARDS).map((summary) => (
                <ProjectCard key={summary.project.id} summary={summary} workspace={workspace} />
              ))}
        </Box>
      )}
    </Box>
  );
};

export default ProjectCards;

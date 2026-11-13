import { Box, Button, Paper, Skeleton, Typography } from "@mui/material";
import { getBoard } from "../../../api/projectsApi";
import { useAsync } from "../../../hooks/useAsync";
import { boardSummary, share } from "../../../utils/myWork";
import StageBar from "../../tasks/StageBar";
import { TASK_STAGES } from "../../../constants/tasks";
import { LOADING_DELAY_SX, revealChildren } from "../../../theme/motion";

const cardSx = {
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minWidth: 0,
  px: { xs: 2, sm: 2.5 },
  py: 2,
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
};

const gridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
  gap: 2,
};

// one stage's share of all tasks, as a thin bar in the stage's colour over a gray track
const ShareBar = ({ value, color }) => (
  <Box aria-hidden="true" sx={{ height: 6, borderRadius: "1px", bgcolor: "action.selected", overflow: "hidden" }}>
    <Box sx={{ height: "100%", width: `${value}%`, bgcolor: color }} />
  </Box>
);

const StatCard = ({ label, value, caption, bar }) => (
  <Paper elevation={0} sx={cardSx}>
    <Typography variant="body2" color="text.secondary" noWrap>
      {label}
    </Typography>
    <Typography variant="h4" component="p">
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
      {caption}
    </Typography>
    <Box sx={{ mt: "auto" }}>{bar}</Box>
  </Paper>
);

// The project's task counts: total, then to do / in progress / done by the board columns' categories.
// From the board's per-column counts, which are project-wide (the Scrum backlog too) and top-level tasks only.
// `taskVersion` changes after a task is created from Quick actions or restored, so the numbers load again.
const ProjectStats = ({ project, taskVersion }) => {
  const state = useAsync((signal) => getBoard(project.id, signal), [project.id, taskVersion], {
    fallback: "Couldn't load the task counts.",
  });

  // during a reload the previous numbers stay
  if (!state.data) {
    if (state.error) {
      return (
        <Paper
          elevation={0}
          sx={{ ...cardSx, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {state.error}
          </Typography>
          <Button variant="outlined" size="small" onClick={state.reload}>
            Retry
          </Button>
        </Paper>
      );
    }
    return (
      <Box sx={{ ...gridSx, ...LOADING_DELAY_SX }}>
        {/* the real card with placeholder text, so nothing under it moves when the numbers arrive */}
        {[0, 1, 2, 3].map((i) => (
          <StatCard
            key={i}
            label={<Skeleton width="45%" />}
            value={<Skeleton width={56} />}
            caption={<Skeleton width="65%" />}
            bar={<Skeleton variant="rounded" height={6} />}
          />
        ))}
      </Box>
    );
  }

  const board = boardSummary(state.data.columns);
  const empty = board.total === 0;

  // the four cards come in one after another, left to right
  return (
    <Box sx={{ ...gridSx, ...revealChildren(0) }}>
      <StatCard
        label="Total tasks"
        value={board.total}
        caption={
          empty
            ? "No tasks yet"
            : board.subtasks > 0
              ? `Plus ${board.subtasks} ${board.subtasks === 1 ? "subtask" : "subtasks"}`
              : "Across all columns"
        }
        bar={<StageBar board={board} />}
      />
      {Object.values(TASK_STAGES).map((stage) => {
        const percent = share(board[stage.value], board.total);
        return (
          <StatCard
            key={stage.value}
            label={stage.label}
            value={board[stage.value]}
            caption={empty ? "No tasks yet" : `${percent}% of all tasks`}
            bar={<ShareBar value={percent} color={stage.bar} />}
          />
        );
      })}
    </Box>
  );
};

export default ProjectStats;

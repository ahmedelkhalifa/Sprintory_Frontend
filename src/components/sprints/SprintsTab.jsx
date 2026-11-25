import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import LoadState from "../general/LoadState";
import ToneChip from "../general/ToneChip";
import NoWorkAccess from "../tasks/NoWorkAccess";
import SprintBoardHeader from "../board/SprintBoardHeader";
import ScopeChanges from "./ScopeChanges";
import { loadWork } from "../tasks/loadWork";
import { listEndedSprints } from "../../api/sprintsApi";
import SprintSummary from "./SprintSummary";
import RetroButton from "../retro/RetroButton";
import { useAsync } from "../../hooks/useAsync";
import { PERMISSIONS } from "../../constants/projects";
import { SPRINT_STATUS, TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { can } from "../../utils/project";
import { formatEstimate } from "../../utils/task";
import { LOADING_DELAY_SX, revealChildren } from "../../theme/motion";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const sprintDates = (sprint) =>
  sprint.startDate && sprint.endDate ? `${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}` : "No dates yet";

const Section = ({ title, children }) => (
  <Box component="section">
    <Typography component="h2" sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

// a number on top of a short label
const Stat = ({ value, label, tone = "text.primary" }) => (
  <Box sx={{ flex: "1 1 140px", p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 22, color: tone }}>{value}</Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

const EmptyPanel = ({ children }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
    {children}
  </Paper>
);

// The active sprint in detail: the board's header (dates, goal, progress), the numbers the backend keeps (points
// committed at the start, points in it now, capacity, tasks without points) and what changed since it started.
// `overdue` is the board's `activeSprint.overdue` (still active after its end date)
const CurrentSprint = ({ sprint, tasks, columns, members, overdue }) => {
  const unestimated = sprint.unestimatedTaskIds.length;
  return (
    <Stack spacing={2}>
      {/* read-only here: the sprint is completed or cancelled from the Board */}
      <SprintBoardHeader sprint={sprint} tasks={tasks} columns={columns} overdue={overdue} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Stat value={sprint.committedPoints == null ? "–" : formatEstimate(sprint.committedPoints)} label="points committed at the start" />
        <Stat
          value={formatEstimate(sprint.selectedPoints)}
          label="points in the sprint now"
          tone={sprint.overCapacity ? "warning.main" : "text.primary"}
        />
        <Stat value={sprint.capacity == null ? "–" : formatEstimate(sprint.capacity)} label="capacity" />
        <Stat
          value={unestimated}
          label={unestimated === 1 ? "task not estimated" : "tasks not estimated"}
          tone={unestimated > 0 ? "warning.main" : "text.primary"}
        />
      </Box>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Changes since the start</Typography>
        <ScopeChanges sprintId={sprint.id} members={members} />
      </Paper>
    </Stack>
  );
};

// Current and planned sprints, plus read-only completed and cancelled history, each with its retro button.
// History failures must not prevent the active sprint and backlog summaries from loading.
const SprintsTab = ({ workspace, project, writable, onOpenBacklog }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const state = useAsync(async (signal) => {
    const [work, history] = await Promise.all([
      loadWork(project, "board", signal),
      listEndedSprints(project.id, signal)
        .then((items) => ({ items, error: false }))
        .catch(() => ({ items: [], error: true })),
    ]);
    return { ...work, previousSprints: history.items, historyUnavailable: history.error };
  }, [project.id], {
    enabled: canView,
    fallback: "Couldn't load the sprints. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });

  if (!canView) return <NoWorkAccess />;

  if (!state.data) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, ...LOADING_DELAY_SX }}>
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={4} />
      </Paper>
    );
  }

  const { tasks, columns, members, sprints, board, previousSprints, historyUnavailable } = state.data;
  const active = sprints.find((sprint) => sprint.status === "ACTIVE");
  const planned = sprints.filter((sprint) => sprint.status === "PLANNED");
  const inActive = active && new Set(active.taskIds);

  // the current sprint, then the planned ones (once, when they arrive)
  return (
    <Stack spacing={4} sx={revealChildren(0)}>
      <Section title="Current sprint">
        {active ? (
          <CurrentSprint
            sprint={active}
            tasks={tasks.filter((task) => inActive.has(task.id))}
            columns={columns}
            members={members}
            overdue={board.activeSprint?.overdue}
          />
        ) : (
          <EmptyPanel>
            <Typography sx={{ fontWeight: 600 }}>No active sprint</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Plan a sprint in the backlog and start it to follow it here.
            </Typography>
            <Button variant="outlined" onClick={onOpenBacklog}>
              Open the backlog
            </Button>
          </EmptyPanel>
        )}
      </Section>

      <Section title="Up next">
        {planned.length === 0 ? (
          <EmptyPanel>
            <Typography variant="body2" color="text.secondary">
              No planned sprints.
            </Typography>
          </EmptyPanel>
        ) : (
          <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            {planned.map((sprint, index) => (
              <Box
                key={sprint.id}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  columnGap: 1.25,
                  rowGap: 0.5,
                  px: { xs: 2, sm: 2.5 },
                  py: 1.5,
                  borderTop: index === 0 ? 0 : 1,
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>{sprint.name}</Typography>
                <ToneChip label={SPRINT_STATUS.PLANNED.label} tone={SPRINT_STATUS.PLANNED.tone} dot />
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  {sprintDates(sprint)} · {plural(sprint.taskIds.length, "task")}
                </Typography>
                <Typography variant="body2" color={sprint.overCapacity ? "warning.main" : "text.secondary"}>
                  {formatEstimate(sprint.selectedPoints)}
                  {sprint.capacity != null && ` / ${formatEstimate(sprint.capacity)}`} points
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Section>

      <Section title="Previous sprints">
        {historyUnavailable ? (
          <Alert severity="warning">Previous sprint history is temporarily unavailable.</Alert>
        ) : previousSprints.length === 0 ? (
          <EmptyPanel>
            <Typography variant="body2" color="text.secondary">No completed or cancelled sprints yet.</Typography>
          </EmptyPanel>
        ) : (
          <Stack spacing={2}>
            {[...previousSprints].reverse().map((sprint) => (
              <SprintSummary
                key={sprint.id}
                sprint={sprint}
                action={<RetroButton sprint={sprint} workspace={workspace} project={project} writable={writable} />}
              />
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
};

export default SprintsTab;

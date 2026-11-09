import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import LoadState from "../general/LoadState";
import ToneChip from "../general/ToneChip";
import NoWorkAccess from "../tasks/NoWorkAccess";
import SprintBoardHeader from "../board/SprintBoardHeader";
import ScopeChanges from "./ScopeChanges";
import { loadWork } from "../tasks/loadWork";
import { useAsync } from "../../hooks/useAsync";
import { PERMISSIONS } from "../../constants/projects";
import { SPRINT_STATUS, TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { can } from "../../utils/project";
import { formatEstimate } from "../../utils/task";

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
const CurrentSprint = ({ sprint, tasks, columns, members }) => {
  const unestimated = sprint.unestimatedTaskIds.length;
  return (
    <Stack spacing={2}>
      <SprintBoardHeader sprint={sprint} tasks={tasks} columns={columns} canComplete={false} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Stat value={formatEstimate(sprint.committedPoints ?? 0)} label="points committed at the start" />
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

// The Sprints tab of a Scrum project (R14/R15): the current sprint in detail, the planned ones in short, and the
// ended ones (not yet: the backend can't list them). Read-only for everyone: sprints are planned in the Backlog tab
// and run on the Board. `onOpenBacklog` goes to the Backlog tab.
const SprintsTab = ({ project, onOpenBacklog }) => {
  const canView = can(project, PERMISSIONS.VIEW_WORK);
  const state = useAsync((signal) => loadWork(project, "board", signal), [project.id], {
    enabled: canView,
    fallback: "Couldn't load the sprints. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });

  if (!canView) return <NoWorkAccess />;

  if (!state.data) {
    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={4} />
      </Paper>
    );
  }

  const { tasks, columns, members, sprints } = state.data;
  const active = sprints.find((sprint) => sprint.status === "ACTIVE");
  const planned = sprints.filter((sprint) => sprint.status === "PLANNED");
  const inActive = active && new Set(active.taskIds);

  return (
    <Stack spacing={4}>
      <Section title="Current sprint">
        {active ? (
          <CurrentSprint
            sprint={active}
            tasks={tasks.filter((task) => inActive.has(task.id))}
            columns={columns}
            members={members}
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
        {/* the backend lists only planned and active sprints (sprints-docs §1); see dev-docs/README.md */}
        <EmptyPanel>
          <Typography variant="body2" color="text.secondary">
            Ended sprints will show here once the backend can list them.
          </Typography>
        </EmptyPanel>
      </Section>
    </Stack>
  );
};

export default SprintsTab;

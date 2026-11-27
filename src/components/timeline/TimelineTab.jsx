import { useEffect, useRef, useState } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import ViewTimelineOutlinedIcon from "@mui/icons-material/ViewTimelineOutlined";
import LoadState from "../general/LoadState";
import ConflictsPanel from "./ConflictsPanel";
import TimelineChart from "./TimelineChart";
import TimelineFilters, { TimelineFilterChips } from "./TimelineFilters";
import TimelineToolbar from "./TimelineToolbar";
import UnscheduledPanel from "./UnscheduledPanel";
import { getSchedule } from "../../api/scheduleApi";
import { getBoard, listProjectMembers } from "../../api/projectsApi";
import { listSprints } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import {
  DEFAULT_ZOOM,
  EMPTY_TIMELINE_FILTERS,
  ZOOMS,
  conflictTarget,
  hasTimelineFilters,
  scheduleParams,
} from "../../utils/schedule";
import { FADE_IN_SX, reveal } from "../../theme/motion";
import { ZOOM_STORAGE_KEY } from "./timelineLayout";

// the most members the backend sends in one page; enough to name every assignee in a course-sized project
const MEMBERS_SIZE = 100;

// the tab is members only; a 404 means the caller isn't (any more)
const SCHEDULE_MESSAGES = { RESOURCE_NOT_FOUND: "Only members of this project can see its timeline." };

// how long a row picked from the conflicts stays highlighted
const HIGHLIGHT_MS = 2500;
// coming back to the tab reloads at most once in this time (the tab showing and the window's focus both say so)
const RETURN_RELOAD_GAP_MS = 1000;

const storedZoom = () => {
  try {
    const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
    return ZOOMS[saved] ? saved : DEFAULT_ZOOM;
  } catch {
    return DEFAULT_ZOOM; // storage blocked: the default each time
  }
};

// what the chart needs besides the schedule: the members (to show assignees, and the assignee filter), the board's
// columns (the status filter) and, in Scrum, the planned and active sprints (the sprint filter)
const loadContext = async (project, signal) => {
  const [board, members, sprints] = await Promise.all([
    getBoard(project.id, signal),
    listProjectMembers(project.id, { size: MEMBERS_SIZE }, signal),
    project.template === "SCRUM" ? listSprints(project.id, signal) : [],
  ]);
  return { columns: board.columns, members: members.content, sprints };
};

// a centered message in place of the chart
const Message = ({ title, text, children }) => (
  <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 4, sm: 6 }, textAlign: "center", ...FADE_IN_SX }}>
    <ViewTimelineOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
    <Typography variant="h6" sx={{ mt: 1 }}>
      {title}
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 520, mx: "auto" }}>
      {text}
    </Typography>
    {children}
  </Paper>
);

/**
 * The project's Timeline tab (PMP-48, backend docs/schedule-docs.md), for members, in Scrum and Kanban: one bar per
 * scheduled task on a date axis (TimelineChart), with dependency arrows, milestone diamonds, zoom, Go to today and
 * filters (TimelineFilters, the backend filters). The backend finds the conflicts; they are painted red and listed
 * above the chart (ConflictsPanel), where picking one scrolls to it. Tasks without dates are listed under it
 * (UnscheduledPanel). The chart is view-only for everyone: dates are changed on the task page, which a bar opens in a
 * new tab; coming back to this tab loads the schedule again. `taskVersion` changes when a task is created from the
 * project header, and the schedule loads again too.
 */
const TimelineTab = ({ workspace, project, taskVersion }) => {
  const [filters, setFilters] = useState(EMPTY_TIMELINE_FILTERS);
  const [zoom, setZoom] = useState(storedZoom);
  const chart = useRef(null);
  const params = scheduleParams(filters);

  const context = useAsync((signal) => loadContext(project, signal), [project.id], {
    fallback: "Couldn't load the project's members. Please try again.",
  });
  const state = useAsync((signal) => getSchedule(project.id, params, signal), [project.id, params, taskVersion], {
    fallback: "Couldn't load the timeline. Please try again.",
    messages: SCHEDULE_MESSAGES,
  });
  // while new filters load, the last answer stays on screen (the toolbar's line shows the wait) instead of a skeleton
  const [last, setLast] = useState(null);
  if (state.data && state.data !== last) setLast(state.data);
  const schedule = state.data ?? (state.error ? null : last);

  // a bar opens its task in a new browser tab (or a window beside this one), where its dates may change: coming back
  // here (the tab shows again, or the window gets the focus back) loads the schedule again, so the bars and the
  // conflicts are current (AC 21). One return can fire both; the second within a second is skipped, and so is the
  // focus a page gets right after it opens
  const { reload } = state;
  useEffect(() => {
    let lastReload = Date.now();
    const comeBack = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastReload < RETURN_RELOAD_GAP_MS) return;
      lastReload = Date.now();
      reload();
    };
    document.addEventListener("visibilitychange", comeBack);
    window.addEventListener("focus", comeBack);
    return () => {
      document.removeEventListener("visibilitychange", comeBack);
      window.removeEventListener("focus", comeBack);
    };
  }, [reload]);

  // the conflict's row, briefly highlighted (a new object each pick, so picking it again starts the time again)
  const [highlight, setHighlight] = useState(null);
  useEffect(() => {
    if (!highlight) return undefined;
    const timer = setTimeout(() => setHighlight(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlight]);

  const selectConflict = (conflict) => {
    const taskId = conflictTarget(conflict, new Set(schedule.tasks.map((task) => task.id)));
    if (taskId == null) return;
    setHighlight({ taskId });
    chart.current?.scrollToRow(taskId);
  };

  const changeZoom = (value) => {
    setZoom(value);
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, value);
    } catch {
      // not remembered; the zoom still changes
    }
  };

  const scheduled = schedule?.tasks.length > 0;
  const filtering = hasTimelineFilters(filters);
  // what the filter groups are made of; the milestones come with the schedule
  const filterOptions = {
    ...context.data,
    milestones: schedule?.milestones ?? [],
    scrum: project.template === "SCRUM",
  };

  let content;
  if (!schedule) {
    content = (
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={6} />
      </Paper>
    );
  } else if (!scheduled && filtering) {
    content = (
      <Message title="No scheduled tasks match these filters" text="Try other filters, or show every task again.">
        <Button variant="outlined" onClick={() => setFilters(EMPTY_TIMELINE_FILTERS)} sx={{ mt: 2 }}>
          Clear filters
        </Button>
      </Message>
    );
  } else if (!scheduled) {
    content = (
      <Message
        title="Nothing on the timeline yet"
        text="Give a task a start date and a due date on its page, and it shows here as a bar from start to due."
      />
    );
  } else {
    content = (
      <>
        <ConflictsPanel conflicts={schedule.conflicts ?? []} onSelect={selectConflict} />
        <TimelineChart
          ref={chart}
          workspace={workspace}
          project={project}
          schedule={schedule}
          zoom={zoom}
          members={context.data?.members ?? []}
          highlightId={highlight?.taskId}
        />
      </>
    );
  }

  return (
    <Stack spacing={1}>
      <TimelineToolbar
        zoom={zoom}
        onZoomChange={changeZoom}
        onToday={() => chart.current?.scrollToToday()}
        onRefresh={reload}
        todayDisabled={!scheduled}
        loading={state.loading && Boolean(schedule)}
        chips={filtering && <TimelineFilterChips filters={filters} onChange={setFilters} options={filterOptions} />}
      >
        <TimelineFilters filters={filters} onChange={setFilters} options={filterOptions} />
      </TimelineToolbar>
      {schedule ? (
        // the sections come in one after another once the first answer is there
        <Stack spacing={2} sx={reveal(1)}>
          {content}
          {/* project-wide, whatever the filters (backend schedule-docs §2) */}
          <UnscheduledPanel
            workspace={workspace}
            project={project}
            tasks={schedule.unscheduled ?? []}
            canEditDates={Boolean(schedule.canEditDates)}
          />
        </Stack>
      ) : (
        content
      )}
    </Stack>
  );
};

export default TimelineTab;

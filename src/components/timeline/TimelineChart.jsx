import { memo, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Link, Paper, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import UserAvatar from "../general/UserAvatar";
import StageIcon from "./StageIcon";
import TimelineArrows from "./TimelineArrows";
import TimelineAxis from "./TimelineAxis";
import TimelineHoverCard from "./TimelineHoverCard";
import { axisTicks, dayNumber, timelineLayout, timelineRange, zoomOf } from "../../utils/schedule";
import { taskPath } from "../../utils/task";
import { formatDate } from "../../utils/format";
import { hoverTransition, prefersReducedMotion } from "../../theme/motion";
import {
  AXIS_HEIGHT,
  BAR_INSET,
  LIST_WIDTH,
  LIST_WIDTH_PHONE,
  MILESTONE_LANE,
  ROW_HEIGHT,
  STAGE_STYLE,
} from "./timelineLayout";

// a task opens in a new browser tab, so the chart stays where it was (PMP-48); it reloads when you come back
const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" };

// ----- shared styles: every bar, row and line only adds its position inline, so 500 rows stay light -----

const BAR_BASE = {
  position: "absolute",
  height: ROW_HEIGHT - 2 * BAR_INSET,
  borderRadius: 1,
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  px: 0.75,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textDecoration: "none",
  typography: "caption",
  fontWeight: 600,
  lineHeight: 1,
  transition: hoverTransition("opacity"),
  "&:focus-visible": { outline: "2px solid", outlineColor: (theme) => theme.palette.primary.main, outlineOffset: 2 },
};
const barSx = (category, conflict) => {
  const { fill, text } = STAGE_STYLE[category] ?? STAGE_STYLE.TODO;
  const done = category === "DONE";
  return {
    ...BAR_BASE,
    bgcolor: fill,
    color: text,
    // done bars are muted, with a check (AC 12)
    opacity: done ? 0.55 : 1,
    "&:hover": { opacity: done ? 0.75 : 0.85 },
    // a conflict: a red ring and a warning icon (AC 17, 20)
    ...(conflict && { boxShadow: (theme) => `0 0 0 2px ${theme.palette.error.main}` }),
  };
};
const BAR_SX = Object.fromEntries(
  Object.keys(STAGE_STYLE).flatMap((category) => [
    [category, barSx(category, false)],
    [`${category}!`, barSx(category, true)],
  ]),
);
const BAR_TEXT_SX = { overflow: "hidden", textOverflow: "ellipsis" };
const BAR_ICON_SX = { fontSize: 14, flexShrink: 0 };

const ROW_SX = {
  height: ROW_HEIGHT,
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.5,
  borderBottom: 1,
  borderColor: "divider",
};
const ROW_HIGHLIGHT_SX = { ...ROW_SX, bgcolor: "action.selected" };
const ROW_KEY_SX = { fontWeight: 700, color: "text.secondary", flexShrink: 0 };
const ROW_TITLE_SX = { flex: 1, minWidth: 0 };
const ROW_WARNING_SX = { fontSize: 18, color: "error.main", flexShrink: 0 };

const LINE_SX = { position: "absolute", top: 0, bottom: 0, width: "1px", bgcolor: "divider" };
const WEEKEND_SX = { position: "absolute", top: 0, bottom: 0, bgcolor: "action.hover" };
// under the bars (they come later), so it never cuts through a bar's text
const TODAY_SX = { position: "absolute", top: 0, bottom: 0, width: "2px", ml: "-1px", bgcolor: "warning.main", pointerEvents: "none" };
const HIGHLIGHT_SX = { position: "absolute", left: 0, right: 0, height: ROW_HEIGHT, bgcolor: "action.selected", pointerEvents: "none" };
const MILESTONE_LINE_SX = { position: "absolute", top: 0, bottom: 0, borderLeft: "1px dashed", borderColor: "text.disabled", pointerEvents: "none" };
const DIAMOND_SIZE = 12;
const diamondSx = (conflict) => ({
  position: "absolute",
  top: (MILESTONE_LANE - DIAMOND_SIZE) / 2,
  width: DIAMOND_SIZE,
  height: DIAMOND_SIZE,
  ml: `${-DIAMOND_SIZE / 2}px`,
  transform: "rotate(45deg)",
  borderRadius: "2px",
  bgcolor: conflict ? "error.main" : "text.primary",
  cursor: "default",
  "&:focus-visible": { outline: "2px solid", outlineColor: (theme) => theme.palette.primary.main, outlineOffset: 2 },
});
const DIAMOND_SX = diamondSx(false);
const DIAMOND_CONFLICT_SX = diamondSx(true);

// a bar's text: the dates as people read them, and what is wrong with them
const barLabel = (task, conflicts) =>
  [`${task.key} ${task.title}, ${formatDate(task.startDate)} to ${formatDate(task.dueDate)}, ${task.statusName}`, ...conflicts].join(". ");

// one task's bar, from the start of its start day to the end of its due day, a link to its page
const Bar = ({ row, href, onHover }) => {
  const { task, box, conflicts } = row;
  const width = Math.max(box.width, 4);
  const conflict = conflicts.length > 0;
  const show = (e) => onHover({ anchor: e.currentTarget, task, conflicts });
  return (
    <Box
      component="a"
      href={href}
      {...NEW_TAB}
      aria-label={barLabel(task, conflicts)}
      data-task-id={task.id}
      data-conflict={conflict || undefined}
      onMouseEnter={show}
      onFocus={show}
      onMouseLeave={() => onHover(null)}
      onBlur={() => onHover(null)}
      sx={BAR_SX[`${task.statusCategory}${conflict ? "!" : ""}`] ?? BAR_SX.TODO}
      style={{ top: row.top + BAR_INSET, left: box.left, width }}
    >
      {conflict && width >= 24 && <WarningAmberRoundedIcon sx={BAR_ICON_SX} />}
      {!conflict && task.statusCategory === "DONE" && width >= 24 && <CheckIcon sx={BAR_ICON_SX} />}
      {width >= 64 && (
        <Box component="span" sx={BAR_TEXT_SX}>
          {task.key} · {task.title}
        </Box>
      )}
    </Box>
  );
};

// every bar; drawn again only when the layout changes, not on hover or scroll
const Bars = memo(({ rows, hrefFor, onHover }) =>
  rows.map((row) => <Bar key={row.task.id} row={row} href={hrefFor(row.task.id)} onHover={onHover} />),
);

// the lines between days / weeks / months and the weekend columns, under the bars
const GridLines = memo(({ units, range, dayWidth }) =>
  units.map((unit) => {
    const left = (unit.start - range.start) * dayWidth;
    return unit.weekend ? (
      <Box key={unit.key} sx={WEEKEND_SX} style={{ left, width: unit.days * dayWidth }} />
    ) : (
      <Box key={unit.key} sx={LINE_SX} style={{ left }} />
    );
  }),
);

// the list on the left: status icon, key and title (both open the task in a new tab), a warning for a conflict,
// the assignee
const RowLabels = memo(({ rows, people, hrefFor, highlightId }) =>
  rows.map(({ task, conflicts }) => {
    const assignee =
      task.assigneeId == null ? null : (people.get(task.assigneeId) ?? { userId: task.assigneeId, firstName: task.assignee });
    const href = hrefFor(task.id);
    return (
      <Box key={task.id} sx={task.id === highlightId ? ROW_HIGHLIGHT_SX : ROW_SX}>
        <StageIcon category={task.statusCategory} statusName={task.statusName} />
        <Link href={href} {...NEW_TAB} variant="caption" underline="hover" sx={ROW_KEY_SX}>
          {task.key}
        </Link>
        <Typography variant="body2" noWrap title={task.title} sx={ROW_TITLE_SX}>
          {task.title}
        </Typography>
        {/* a plain title, not a Tooltip: a project full of conflicts would mount hundreds of them */}
        {conflicts.length > 0 && (
          <Box component="span" title={conflicts.join(" · ")} sx={{ display: "inline-flex" }}>
            <WarningAmberRoundedIcon role="img" aria-label={conflicts.join(". ")} sx={ROW_WARNING_SX} />
          </Box>
        )}
        {assignee && <UserAvatar user={assignee} size={22} />}
      </Box>
    );
  }),
);

// the milestones' diamonds on their target days (AC 11), red when a task ends after one (AC 20). There is no
// milestone page in the app yet, so a diamond shows its details on hover and focus instead of linking
const Diamonds = memo(({ milestones, onHover }) =>
  milestones.map((milestone) => {
    const show = (e) => onHover({ anchor: e.currentTarget, milestone, conflicts: milestone.conflicts });
    return (
      <Box
        key={milestone.id}
        tabIndex={0}
        role="img"
        aria-label={[`Milestone ${milestone.name}, ${formatDate(milestone.targetDate)}`, ...milestone.conflicts].join(". ")}
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={() => onHover(null)}
        onBlur={() => onHover(null)}
        sx={milestone.conflicts.length ? DIAMOND_CONFLICT_SX : DIAMOND_SX}
        style={{ left: milestone.x }}
      />
    );
  }),
);

/**
 * The Timeline's chart (PMP-48): one scroll area with the task list sticky on the left and the date header (with the
 * milestones' diamonds) sticky on top. Each scheduled task is a row, in the response's order (start date, then id),
 * with its bar placed by timelineLayout; arrows join blockers to the tasks they block, and conflicts are red. The
 * Today line comes from the server's `today`. `ref` gets { scrollToToday, scrollToRow(id) }. The day in the middle
 * of the view stays there when the zoom changes; the first view is centred on today. `highlightId` marks a row (the
 * conflict the user picked).
 */
const TimelineChart = ({ ref, workspace, project, schedule, zoom, members, highlightId }) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const listWidth = phone ? LIST_WIDTH_PHONE : LIST_WIDTH;
  const { dayWidth } = zoomOf(zoom);
  const [hover, setHover] = useState(null);

  const range = useMemo(() => timelineRange(schedule, zoom), [schedule, zoom]);
  const ticks = useMemo(() => axisTicks(range, zoom), [range, zoom]);
  const layout = useMemo(() => timelineLayout(schedule, range, { dayWidth, rowHeight: ROW_HEIGHT }), [schedule, range, dayWidth]);
  const people = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members]);
  const hrefFor = useCallback((taskId) => taskPath(workspace, project, taskId), [workspace, project]);
  const highlightRow = highlightId == null ? null : layout.byId.get(highlightId);
  const headerHeight = AXIS_HEIGHT + (layout.milestones.length > 0 ? MILESTONE_LANE : 0);
  // a hover belongs to the layout it was made on: after a reload or a filter its bar may be gone
  const showHover = useCallback((next) => setHover(next && { ...next, layout }), [layout]);
  const shownHover = hover?.layout === layout ? hover : null;

  const scrollRef = useRef(null);
  // the day in the middle of the view (a fraction), kept while scrolling so a zoom can put it back in the middle
  const centerDay = useRef(null);
  const today = dayNumber(schedule.today);

  const rememberCenter = () => {
    const el = scrollRef.current;
    centerDay.current = range.start + (el.scrollLeft + (el.clientWidth - listWidth) / 2) / dayWidth;
  };

  // a new zoom or range: the same day goes back to the middle (today the first time)
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const day = centerDay.current ?? today + 0.5;
    el.scrollLeft = Math.max(0, (day - range.start) * dayWidth - (el.clientWidth - listWidth) / 2);
  }, [range.start, dayWidth, listWidth, today]);

  useImperativeHandle(ref, () => {
    const scrollTo = (position) =>
      scrollRef.current.scrollTo({ ...position, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    return {
      scrollToToday: () =>
        scrollTo({ left: Math.max(0, layout.todayX - (scrollRef.current.clientWidth - listWidth) / 2) }),
      // the row in the middle, its bar a little in from the left
      scrollToRow: (taskId) => {
        const row = layout.byId.get(taskId);
        if (!row) return;
        scrollTo({
          left: Math.max(0, row.box.left - 48),
          top: Math.max(0, row.top - (scrollRef.current.clientHeight - headerHeight - ROW_HEIGHT) / 2),
        });
      },
    };
  }, [layout, listWidth, headerHeight]);

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box
        ref={scrollRef}
        onScroll={rememberCenter}
        sx={{ overflow: "auto", position: "relative", maxHeight: { xs: 520, md: "calc(100vh - 260px)" }, minHeight: 200 }}
      >
        <Box sx={{ display: "grid" }} style={{ gridTemplateColumns: `${listWidth}px ${layout.width}px`, width: listWidth + layout.width }}>
          {/* the corner: stays put both ways */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              left: 0,
              zIndex: 4,
              display: "flex",
              alignItems: "flex-end",
              px: 1.5,
              pb: 0.75,
              bgcolor: "background.paper",
              borderRight: 1,
              borderBottom: 1,
              borderColor: "divider",
            }}
            style={{ height: headerHeight }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              {layout.rows.length} {layout.rows.length === 1 ? "task" : "tasks"}
            </Typography>
          </Box>

          {/* the date header and the milestones: stay on top */}
          <Box sx={{ position: "sticky", top: 0, zIndex: 3, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
            <TimelineAxis ticks={ticks} range={range} dayWidth={dayWidth} zoom={zoom} stickyLeft={listWidth + 8} />
            {layout.milestones.length > 0 && (
              <Box sx={{ position: "relative", height: MILESTONE_LANE, borderTop: 1, borderColor: "divider" }}>
                <Diamonds milestones={layout.milestones} onHover={showHover} />
              </Box>
            )}
            <Box sx={{ ...TODAY_SX, top: AXIS_HEIGHT / 2 }} style={{ left: layout.todayX }} />
          </Box>

          {/* the task list: stays on the left */}
          <Box sx={{ position: "sticky", left: 0, zIndex: 2, bgcolor: "background.paper", borderRight: 1, borderColor: "divider" }}>
            <RowLabels rows={layout.rows} people={people} hrefFor={hrefFor} highlightId={highlightId} />
          </Box>

          {/* the bars over the arrows, the lines and a hairline under every row */}
          <Box
            sx={(t) => ({
              position: "relative",
              backgroundImage: `linear-gradient(to bottom, transparent ${ROW_HEIGHT - 1}px, ${t.palette.divider} ${ROW_HEIGHT - 1}px)`,
              backgroundSize: `100% ${ROW_HEIGHT}px`,
            })}
            style={{ height: layout.height }}
          >
            <GridLines units={ticks.units} range={range} dayWidth={dayWidth} />
            {highlightRow && <Box sx={HIGHLIGHT_SX} style={{ top: highlightRow.top }} />}
            {layout.milestones.map((milestone) => (
              <Box key={milestone.id} sx={MILESTONE_LINE_SX} style={{ left: milestone.x }} />
            ))}
            <Box sx={TODAY_SX} style={{ left: layout.todayX }} role="img" aria-label={`Today, ${formatDate(schedule.today)}`} />
            <TimelineArrows arrows={layout.arrows} width={layout.width} height={layout.height} />
            <Bars rows={layout.rows} hrefFor={hrefFor} onHover={showHover} />
          </Box>
        </Box>
      </Box>
      <TimelineHoverCard hover={shownHover} milestones={schedule.milestones ?? []} />
    </Paper>
  );
};

export default TimelineChart;

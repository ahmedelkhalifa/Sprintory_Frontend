// The project Timeline (PMP-48, backend docs/schedule-docs.md): pure helpers that turn GET /projects/{id}/schedule
// into what the chart draws. Dates are calendar days ("2026-11-10"), counted as whole UTC days so no time zone or
// daylight-saving change can move a bar. A bar runs from its start day to the END of its due day (the backend's
// inclusive finish), so a one-day task is one day wide.

const DAY_MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-10" -> whole days since 1970-01-01, and back
export const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
export const isoDay = (day) => new Date(day * DAY_MS).toISOString().slice(0, 10);

// 0 = Monday … 6 = Sunday (1970-01-01 was a Thursday)
export const weekday = (day) => (((day + 3) % 7) + 7) % 7;

const dateOf = (day) => new Date(day * DAY_MS);
const monthStart = (day) => {
  const date = dateOf(day);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / DAY_MS;
};
const nextMonthStart = (day) => {
  const date = dateOf(day);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / DAY_MS;
};

// the zoom levels: how many pixels one day gets. `pad` is the room left before the first and after the last bar,
// `minDays` how much the axis shows at least (a short schedule shouldn't end halfway across the screen)
export const ZOOMS = {
  day: { value: "day", label: "Day", dayWidth: 36, pad: 3, minDays: 42 },
  week: { value: "week", label: "Week", dayWidth: 14, pad: 7, minDays: 98 },
  month: { value: "month", label: "Month", dayWidth: 4, pad: 14, minDays: 365 },
};
export const DEFAULT_ZOOM = "week";
export const zoomOf = (value) => ZOOMS[value] ?? ZOOMS[DEFAULT_ZOOM];

// snaps the first day back to a Monday (day, week) or a month's first day (month), the last day forward to a Sunday
// or a month's last day, so the axis starts and ends on a label
const snap = (first, last, zoom) =>
  zoom === "month"
    ? { start: monthStart(first), end: nextMonthStart(last) - 1 }
    : { start: first - weekday(first), end: last + (6 - weekday(last)) };

/**
 * The days the chart shows: { start, end, days } (day numbers, both included). From the project's earliest start to
 * its latest due date (the backend's bounds cover the whole project, whatever the filters, so the axis doesn't jump
 * when a filter changes), widened to include today, padded, snapped to whole weeks or months and at least `minDays`
 * long. With nothing scheduled (null bounds) it is the time around today.
 */
export const timelineRange = ({ today, earliestStartDate, latestDueDate }, zoomValue) => {
  const zoom = zoomOf(zoomValue);
  const now = dayNumber(today);
  const first = Math.min(earliestStartDate ? dayNumber(earliestStartDate) : now, now) - zoom.pad;
  let last = Math.max(latestDueDate ? dayNumber(latestDueDate) : now, now) + zoom.pad;
  if (last - first + 1 < zoom.minDays) last = first + zoom.minDays - 1;
  const { start, end } = snap(first, last, zoom.value);
  return { start, end, days: end - start + 1 };
};

// where a day begins on the chart, in pixels from its left edge
export const dayX = (day, range, dayWidth) => (day - range.start) * dayWidth;

// a task's bar: from the start of its start day to the end of its due day
export const barBox = ({ startDate, dueDate }, range, dayWidth) => {
  const start = dayNumber(startDate);
  return { left: dayX(start, range, dayWidth), width: (dayNumber(dueDate) - start + 1) * dayWidth };
};

/**
 * The date header's two lines, in days (the chart turns them into pixels): `groups` on top, `units` below, each
 * { key, start, days, label } and cut to the range. Day zoom: months over day numbers (with `weekend`); week zoom:
 * months over weeks named by their Monday; month zoom: years over months.
 */
export const axisTicks = (range, zoomValue) => {
  const zoom = zoomOf(zoomValue).value;
  const clip = (start, next) => {
    const from = Math.max(start, range.start);
    return { start: from, days: Math.min(next, range.end + 1) - from };
  };

  const months = [];
  for (let day = monthStart(range.start); day <= range.end; day = nextMonthStart(day)) {
    const date = dateOf(day);
    const label = zoom === "month" ? MONTHS[date.getUTCMonth()] : `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    months.push({ key: `m${day}`, ...clip(day, nextMonthStart(day)), label });
  }
  if (zoom === "month") {
    const years = [];
    for (const month of months) {
      const year = dateOf(month.start).getUTCFullYear();
      const last = years[years.length - 1];
      if (last?.label === String(year)) last.days += month.days;
      else years.push({ key: `y${year}`, start: month.start, days: month.days, label: String(year) });
    }
    return { groups: years, units: months };
  }

  const units = [];
  if (zoom === "day") {
    for (let day = range.start; day <= range.end; day += 1) {
      units.push({ key: `d${day}`, start: day, days: 1, label: String(dateOf(day).getUTCDate()), weekend: weekday(day) >= 5 });
    }
  } else {
    for (let day = range.start - weekday(range.start); day <= range.end; day += 7) {
      const date = dateOf(day);
      units.push({ key: `w${day}`, ...clip(day, day + 7), label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}` });
    }
  }
  return { groups: months, units };
};

/**
 * An arrow's path (SVG `d`) from the end of the blocker's bar (x1, y1) to the start of the blocked task's bar (x2, y2),
 * the rows' middles. With room between them: out, down (or up), across. When the blocked task starts before the
 * blocker ends (a conflict, or a tight fit): out, to the gap between the rows just above (or below) the blocked
 * task, back left, then in. The last part always runs right for `gap` pixels, so the arrowhead shows.
 */
export const arrowPath = ({ x1, y1, x2, y2 }, { rowHeight, gap = 8 }) => {
  if (x2 - x1 >= gap * 2) return `M ${x1} ${y1} H ${x1 + gap} V ${y2} H ${x2}`;
  const between = y2 > y1 ? y2 - rowHeight / 2 : y2 + rowHeight / 2;
  return `M ${x1} ${y1} H ${x1 + gap} V ${between} H ${x2 - gap} V ${y2} H ${x2}`;
};

/**
 * The response's conflicts, looked up by what they paint (backend schedule-docs §2): `tasks` maps a task id to the
 * messages of every conflict it is in (a dependency conflict names [blockerId, blockedId], a milestone one the task),
 * `dependencies` and `milestones` hold the ids of the arrows and diamonds involved.
 */
export const conflictIndex = (conflicts = []) => {
  const tasks = new Map();
  const dependencies = new Set();
  const milestones = new Set();
  for (const conflict of conflicts) {
    for (const id of conflict.taskIds ?? []) {
      if (!tasks.has(id)) tasks.set(id, []);
      tasks.get(id).push(conflict.message);
    }
    if (conflict.dependencyId != null) dependencies.add(conflict.dependencyId);
    if (conflict.milestoneId != null) milestones.add(conflict.milestoneId);
  }
  return { tasks, dependencies, milestones };
};

// the row a conflict scrolls to (backend schedule-docs §2): the blocked task if it is on the chart, else the
// blocker; a milestone conflict's only task. null when none of them is shown (a filter hides them)
export const conflictTarget = (conflict, shownIds) => {
  const ids = conflict.taskIds ?? [];
  const order = conflict.type === "DEPENDENCY" ? [ids[1], ids[0]] : ids;
  return order.find((id) => id != null && shownIds.has(id)) ?? null;
};

/**
 * Everything the chart draws, computed once per response, zoom and row height: `rows` (the response's tasks in its
 * order, start date then id, each with `top` and its bar's `box`), `arrows` (only links whose two tasks are rows),
 * `milestones` with their `x`, the `today` line's x, and the size of the drawing.
 */
export const timelineLayout = (schedule, range, { dayWidth, rowHeight }) => {
  const conflicts = conflictIndex(schedule.conflicts);
  const rows = schedule.tasks.map((task, index) => ({
    task,
    index,
    top: index * rowHeight,
    box: barBox(task, range, dayWidth),
    conflicts: conflicts.tasks.get(task.id) ?? [],
  }));
  const byId = new Map(rows.map((row) => [row.task.id, row]));

  const arrows = [];
  for (const link of schedule.dependencies ?? []) {
    const from = byId.get(link.blockerId);
    const to = byId.get(link.blockedId);
    if (!from || !to) continue;
    const points = {
      x1: from.box.left + from.box.width,
      y1: from.top + rowHeight / 2,
      x2: to.box.left,
      y2: to.top + rowHeight / 2,
    };
    arrows.push({ id: link.id, d: arrowPath(points, { rowHeight }), conflict: conflicts.dependencies.has(link.id) });
  }

  // a diamond sits in the middle of its target day
  const milestones = (schedule.milestones ?? []).map((milestone) => ({
    ...milestone,
    x: dayX(dayNumber(milestone.targetDate), range, dayWidth) + dayWidth / 2,
    conflict: conflicts.milestones.has(milestone.id),
  }));

  return {
    rows,
    byId,
    arrows,
    milestones,
    todayX: dayX(dayNumber(schedule.today), range, dayWidth) + dayWidth / 2,
    width: range.days * dayWidth,
    height: rows.length * rowHeight,
  };
};

// ----- filters (backend schedule-docs §2: every one that is set narrows the rows) -----

export const EMPTY_TIMELINE_FILTERS = {
  assigneeId: null,
  milestoneId: null,
  type: null,
  statusId: null,
  sprintId: null,
  hideDone: false,
};

const PICKED = ["assigneeId", "milestoneId", "type", "statusId", "sprintId"];

// the query params: only the filters that are set; hideDone only when on
export const scheduleParams = (filters) => {
  const params = {};
  for (const name of PICKED) {
    if (filters[name] !== null && filters[name] !== undefined && filters[name] !== "") params[name] = filters[name];
  }
  if (filters.hideDone) params.hideDone = true;
  return params;
};

export const hasTimelineFilters = (filters) => Object.keys(scheduleParams(filters)).length > 0;

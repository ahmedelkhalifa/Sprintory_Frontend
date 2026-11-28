import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_TIMELINE_FILTERS,
  ZOOMS,
  arrowPath,
  axisTicks,
  barBox,
  conflictIndex,
  conflictTarget,
  dayNumber,
  dayX,
  hasTimelineFilters,
  isoDay,
  scheduleParams,
  timelineLayout,
  timelineRange,
  weekday,
  zoomOf,
} from "../src/utils/schedule.js";

// the backend's example response (schedule-docs §2), plus a hidden counterpart in a conflict and a milestone
const SCHEDULE = {
  today: "2026-11-26",
  earliestStartDate: "2026-11-08",
  latestDueDate: "2026-11-12",
  canEditDates: true,
  milestonesAvailable: true,
  tasks: [
    { id: 10, key: "PMP-10", startDate: "2026-11-08", dueDate: "2026-11-10", statusCategory: "IN_PROGRESS" },
    { id: 11, key: "PMP-11", startDate: "2026-11-10", dueDate: "2026-11-12", statusCategory: "TODO" },
  ],
  dependencies: [
    { id: 21, blockerId: 10, blockedId: 11 },
    { id: 22, blockerId: 11, blockedId: 99 },
  ],
  milestones: [{ id: 4, name: "Beta release", targetDate: "2026-11-20" }],
  conflicts: [
    { type: "DEPENDENCY", taskIds: [10, 11], dependencyId: 21, milestoneId: null, message: "PMP-11 starts before PMP-10 ends" },
    { type: "MILESTONE", taskIds: [11], dependencyId: null, milestoneId: 4, message: "PMP-11 ends after milestone Beta release" },
  ],
  unscheduled: [],
};

test("dayNumber and isoDay turn calendar days into whole days and back", () => {
  assert.equal(dayNumber("1970-01-01"), 0);
  assert.equal(dayNumber("2026-11-11") - dayNumber("2026-11-10"), 1);
  // across a daylight-saving change and a month end the count stays whole
  assert.equal(dayNumber("2026-11-01") - dayNumber("2026-10-25"), 7);
  assert.equal(isoDay(dayNumber("2026-02-28") + 1), "2026-03-01");
  assert.equal(isoDay(dayNumber("2028-02-28") + 1), "2028-02-29");
});

test("weekday counts from Monday", () => {
  assert.equal(weekday(dayNumber("2026-11-23")), 0); // a Monday
  assert.equal(weekday(dayNumber("2026-11-27")), 4); // Friday
  assert.equal(weekday(dayNumber("2026-11-29")), 6); // Sunday
  assert.equal(weekday(dayNumber("1969-12-29")), 0); // before 1970 too
});

test("zoomOf falls back to the default zoom", () => {
  assert.equal(zoomOf("day").dayWidth, ZOOMS.day.dayWidth);
  assert.equal(zoomOf("nonsense").value, "week");
});

test("timelineRange covers the whole project and today, padded to whole weeks", () => {
  const range = timelineRange(SCHEDULE, "week");
  assert.equal(weekday(range.start), 0);
  assert.equal(weekday(range.end), 6);
  assert.ok(range.start < dayNumber("2026-11-08") && range.end > dayNumber("2026-11-26"));
  assert.equal(range.days, range.end - range.start + 1);
  assert.ok(range.days >= ZOOMS.week.minDays);
  // first day: Nov 8 minus a week of room is Sunday Nov 1, so the axis starts on Monday Oct 26
  assert.equal(isoDay(range.start), "2026-10-26");
});

test("timelineRange: the same axis whatever the filters, since the bounds are project-wide", () => {
  const filtered = { ...SCHEDULE, tasks: SCHEDULE.tasks.slice(0, 1) };
  assert.deepEqual(timelineRange(filtered, "day"), timelineRange(SCHEDULE, "day"));
});

test("timelineRange works with nothing scheduled (null bounds) and in month zoom", () => {
  const empty = timelineRange({ today: "2026-11-26", earliestStartDate: null, latestDueDate: null }, "day");
  assert.ok(empty.start <= dayNumber("2026-11-26") && empty.end >= dayNumber("2026-11-26"));
  assert.ok(empty.days >= ZOOMS.day.minDays);

  const months = timelineRange(SCHEDULE, "month");
  assert.equal(isoDay(months.start).slice(8), "01");
  assert.equal(isoDay(months.end + 1).slice(8), "01"); // ends on a month's last day
  assert.ok(months.days >= ZOOMS.month.minDays);
});

test("barBox runs from the start of the start day to the end of the due day", () => {
  const range = { start: dayNumber("2026-11-09"), end: dayNumber("2026-11-30"), days: 22 };
  assert.deepEqual(barBox({ startDate: "2026-11-10", dueDate: "2026-11-12" }, range, 14), { left: 14, width: 42 });
  // a one-day task is one day wide
  assert.deepEqual(barBox({ startDate: "2026-11-09", dueDate: "2026-11-09" }, range, 36), { left: 0, width: 36 });
  assert.equal(dayX(dayNumber("2026-11-16"), range, 4), 28);
});

test("barBox: zooming scales every bar by the same factor, so bars stay on their dates", () => {
  const task = { startDate: "2026-11-10", dueDate: "2026-11-12" };
  const day = barBox(task, timelineRange(SCHEDULE, "day"), ZOOMS.day.dayWidth);
  const dayRange = timelineRange(SCHEDULE, "day");
  // the bar's left edge is exactly where its start day begins on the axis
  assert.equal(day.left, dayX(dayNumber("2026-11-10"), dayRange, ZOOMS.day.dayWidth));
  assert.equal(day.width, 3 * ZOOMS.day.dayWidth);
});

test("axisTicks: day zoom shows each day under its month, weekends marked", () => {
  const range = { start: dayNumber("2026-11-23"), end: dayNumber("2026-12-06"), days: 14 };
  const { groups, units } = axisTicks(range, "day");
  assert.equal(units.length, 14);
  assert.deepEqual(units.slice(0, 2).map((u) => u.label), ["23", "24"]);
  assert.deepEqual(units.filter((u) => u.weekend).map((u) => u.label), ["28", "29", "5", "6"]);
  assert.deepEqual(groups.map((g) => [g.label, g.days]), [["Nov 2026", 8], ["Dec 2026", 6]]);
});

test("axisTicks: week zoom names each week by its Monday", () => {
  const range = { start: dayNumber("2026-11-23"), end: dayNumber("2026-12-13"), days: 21 };
  const { groups, units } = axisTicks(range, "week");
  assert.deepEqual(units.map((u) => [u.label, u.days]), [["Nov 23", 7], ["Nov 30", 7], ["Dec 7", 7]]);
  assert.equal(groups.reduce((sum, g) => sum + g.days, 0), range.days);
});

test("axisTicks: month zoom shows months under their year, cut to the range", () => {
  const range = { start: dayNumber("2026-12-01"), end: dayNumber("2027-01-31"), days: 62 };
  const { groups, units } = axisTicks(range, "month");
  assert.deepEqual(units.map((u) => [u.label, u.days]), [["Dec", 31], ["Jan", 31]]);
  assert.deepEqual(groups.map((g) => [g.label, g.days]), [["2026", 31], ["2027", 31]]);
});

test("arrowPath: out, down and across when there is room", () => {
  assert.equal(arrowPath({ x1: 100, y1: 18, x2: 140, y2: 54 }, { rowHeight: 36 }), "M 100 18 H 108 V 54 H 140");
});

test("arrowPath: when the blocked task starts too early it goes around, between the rows", () => {
  // blocked row below: back along the gap just above it
  assert.equal(
    arrowPath({ x1: 100, y1: 18, x2: 60, y2: 90 }, { rowHeight: 36 }),
    "M 100 18 H 108 V 72 H 52 V 90 H 60",
  );
  // blocked row above
  assert.equal(
    arrowPath({ x1: 100, y1: 90, x2: 100, y2: 18 }, { rowHeight: 36 }),
    "M 100 90 H 108 V 36 H 92 V 18 H 100",
  );
});

test("conflictIndex groups the messages by task and the arrows and diamonds involved", () => {
  const index = conflictIndex(SCHEDULE.conflicts);
  assert.deepEqual(index.tasks.get(10), ["PMP-11 starts before PMP-10 ends"]);
  assert.deepEqual(index.tasks.get(11), ["PMP-11 starts before PMP-10 ends", "PMP-11 ends after milestone Beta release"]);
  assert.ok(index.dependencies.has(21) && !index.dependencies.has(22));
  assert.deepEqual(index.milestones.get(4), ["PMP-11 ends after milestone Beta release"]);
  assert.equal(conflictIndex().tasks.size, 0);
});

test("conflictTarget scrolls to the blocked task, else the blocker, else nothing", () => {
  const [dependency, milestone] = SCHEDULE.conflicts;
  assert.equal(conflictTarget(dependency, new Set([10, 11])), 11);
  assert.equal(conflictTarget(dependency, new Set([10])), 10);
  assert.equal(conflictTarget(dependency, new Set()), null);
  assert.equal(conflictTarget(milestone, new Set([11])), 11);
});

test("timelineLayout: rows in the response's order, arrows only between shown rows, conflicts marked", () => {
  const range = timelineRange(SCHEDULE, "week");
  const layout = timelineLayout(SCHEDULE, range, { dayWidth: 14, rowHeight: 36 });
  assert.deepEqual(layout.rows.map((row) => [row.task.id, row.top]), [[10, 0], [11, 36]]);
  assert.equal(layout.rows[1].conflicts.length, 2);
  // link 22 goes to a task that isn't a row (hidden by a filter): no arrow
  assert.deepEqual(layout.arrows.map((a) => [a.id, a.conflict]), [[21, true]]);
  // the arrow leaves the end of PMP-10's bar and enters the start of PMP-11's
  const [from, to] = layout.rows;
  assert.ok(layout.arrows[0].d.startsWith(`M ${from.box.left + from.box.width} 18`));
  assert.ok(layout.arrows[0].d.endsWith(`H ${to.box.left}`));
  assert.deepEqual(layout.milestones[0].conflicts, ["PMP-11 ends after milestone Beta release"]);
  assert.equal(layout.milestones[0].x, dayX(dayNumber("2026-11-20"), range, 14) + 7);
  assert.equal(layout.todayX, dayX(dayNumber("2026-11-26"), range, 14) + 7);
  assert.equal(layout.width, range.days * 14);
  assert.equal(layout.height, 72);
});

test("scheduleParams sends only the filters that are set", () => {
  assert.deepEqual(scheduleParams(EMPTY_TIMELINE_FILTERS), {});
  assert.equal(hasTimelineFilters(EMPTY_TIMELINE_FILTERS), false);
  assert.deepEqual(scheduleParams({ ...EMPTY_TIMELINE_FILTERS, assigneeId: 7, milestoneId: 4, hideDone: true }), {
    assigneeId: 7,
    milestoneId: 4,
    hideDone: true,
  });
  assert.equal(hasTimelineFilters({ ...EMPTY_TIMELINE_FILTERS, hideDone: true }), true);
});

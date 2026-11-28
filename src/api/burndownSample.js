// the example from burndown-docs.md §3.1; delete together with VITE_MOCK_BURNDOWN
const BURNDOWN_SAMPLE = {
  sprintId: 42,
  sprintName: "MOB Sprint 4",
  sprintStatus: "ACTIVE",
  startDate: "2026-11-30",
  endDate: "2026-12-11",
  endedOn: null,
  today: "2026-12-02",
  unit: "POINTS",
  days: "WORKING",
  hasDailyData: true,
  dates: ["2026-11-30", "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09", "2026-12-10", "2026-12-11"],
  ideal: [30, 27, 24, 21, 18, 15, 15, 15, 12, 9, 6, 3, 0],
  actual: [30, 30, 25, 26, null, null, null, null, null, null, null, null, null],
  scopeChanges: [null, 0, 0, 3, null, null, null, null, null, null, null, null, null],
  summary: { committed: 30, currentScope: 33, scopeChange: 3, done: 7, remaining: 26, daysLeft: 7, unestimatedTasks: 1 },
  status: "BEHIND",
};

export default BURNDOWN_SAMPLE;

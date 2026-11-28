import api from "./client";

// The project Timeline (PMP-48, backend docs/schedule-docs.md). One answer has everything the chart draws: the
// scheduled top-level tasks (start date then id), the dependency links between shown tasks, the project's milestones,
// the conflicts, the unscheduled tasks, `today`, the project's date bounds and `canEditDates`. Members only
// (VIEW_WORK); anyone else, a workspace admin outside the project too, gets 404. Read-only states can still read.
// params (all optional, combined): { assigneeId, statusId, statusCategory, milestoneId, sprintId, type, hideDone,
// from, to }; they narrow the scheduled rows only, never the unscheduled list or the milestones
export const getSchedule = (projectId, params, signal) =>
  api.get(`/projects/${projectId}/schedule`, { params, signal }).then((res) => res.data);

import { getBoard, listProjects } from "../api/projectsApi";
import { listTasks } from "../api/tasksApi";
import { getSprint } from "../api/sprintsApi";
import { isAbort } from "../utils/apiError";
import { boardSummary, openAssigned, sortMyWork } from "../utils/myWork";
import { useAsync } from "./useAsync";

// how many of the workspace's projects the home page looks into, and how many tasks per project
const MAX_PROJECTS = 20;
const MAX_TASKS = 100;

// one project's board, the caller's tasks in it and its running sprint.
// The backend answers 404 for a project the caller can't see (a workspace admin outside it): that project is skipped.
const loadProject = async (project, userId, signal) => {
  const [board, tasks] = await Promise.all([
    getBoard(project.id, signal),
    listTasks(project.id, { assigneeId: userId, order: "board", size: MAX_TASKS }, signal),
  ]);
  const sprint = board.activeSprintId ? await getSprint(board.activeSprintId, signal) : null;
  const columns = board.columns ?? [];
  return {
    assigned: openAssigned(project, columns, tasks.content),
    sprint: sprint && { project, sprint, overdue: board.activeSprint?.overdue },
    // the project card: its board at a glance and what the methodology watches (sprint, or WIP limits)
    summary: {
      project,
      board: boardSummary(columns),
      sprint,
      sprintsEnabled: Boolean(board.sprintsEnabled),
      backlogEnabled: Boolean(board.backlogEnabled),
      wipLimitsEnabled: Boolean(board.wipLimitsEnabled),
    },
  };
};

/**
 * The home page's cross-project view: { items, sprints, projects } where `items` are the caller's open tasks
 * ({ task, project, stage }, most urgent first), `sprints` each Scrum project's running sprint and `projects`
 * a summary per project the caller is in (the workspace's list order), for the project cards.
 * TODO: one board and one task request per project; ask the backend for a "my work" endpoint.
 */
export const useMyWork = (workspaceId, userId) =>
  useAsync(
    async (signal) => {
      const page = await listProjects(workspaceId, { size: MAX_PROJECTS }, signal);
      const results = await Promise.all(
        page.content.map((project) =>
          loadProject(project, userId, signal).catch((err) => {
            if (isAbort(err)) throw err;
            return null; // one project failing doesn't empty the whole list
          }),
        ),
      );
      const loaded = results.filter(Boolean);
      return {
        items: sortMyWork(loaded.flatMap((result) => result.assigned)),
        sprints: loaded.map((result) => result.sprint).filter(Boolean),
        projects: loaded.map((result) => result.summary),
      };
    },
    [workspaceId, userId],
    // without a user id (the dev auth bypass) there's nobody to look up tasks for
    { enabled: Boolean(userId), fallback: "Couldn't load your work. Please try again." },
  );

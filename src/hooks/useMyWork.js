import { getBoard, listProjects } from "../api/projectsApi";
import { listTasks } from "../api/tasksApi";
import { getSprint } from "../api/sprintsApi";
import { isAbort } from "../utils/apiError";
import { openAssigned, sortMyWork } from "../utils/myWork";
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
  return {
    assigned: openAssigned(project, board.columns ?? [], tasks.content),
    sprint: sprint && { project, sprint, overdue: board.activeSprint?.overdue },
  };
};

/**
 * The home page's cross-project view: { items, sprints } where `items` are the caller's open tasks
 * ({ task, project, stage }, most urgent first) and `sprints` each Scrum project's running sprint.
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
      };
    },
    [workspaceId, userId],
    // without a user id (the dev auth bypass) there's nobody to look up tasks for
    { enabled: Boolean(userId), fallback: "Couldn't load your work. Please try again." },
  );

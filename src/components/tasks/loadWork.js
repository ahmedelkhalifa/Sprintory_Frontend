import { getBoard, listProjectMembers } from "../../api/projectsApi";
import { listAllTasks } from "../../api/tasksApi";
import { listSprints } from "../../api/sprintsApi";
import { describeTasks } from "../../utils/task";

// the most members the backend sends in one page; enough to name every assignee in a course-sized project
const MEMBERS_SIZE = 100;

/**
 * Everything the Backlog and Board tabs show, in one load: the project's tasks in `order` ("backlog" or "board"),
 * the board (its columns are the task statuses), the members (to name assignees) and, in Scrum, the planned and
 * active sprints (mocked until the backend has them). Tasks come with `assignee` and `stage` (describeTasks).
 */
export const loadWork = async (project, order, signal) => {
  const [tasks, board, members, sprints] = await Promise.all([
    listAllTasks(project.id, order, signal),
    getBoard(project.id, signal),
    listProjectMembers(project.id, { size: MEMBERS_SIZE }, signal),
    project.template === "SCRUM" ? listSprints(project.id, signal) : [],
  ]);
  const people = members.content;
  return { tasks: describeTasks(tasks, { members: people, columns: board.columns }), board, columns: board.columns, members: people, sprints };
};

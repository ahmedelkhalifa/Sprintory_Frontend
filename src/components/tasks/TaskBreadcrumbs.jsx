import { Link as RouterLink } from "react-router-dom";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { TASK_TYPES } from "../../constants/tasks";
import { projectPath } from "../../utils/project";
import { taskPath } from "../../utils/task";

// a task's key with its icon: the type's for a task, the subtask icon for a subtask
const TaskKey = ({ task }) => {
  if (task.parentTaskId != null) {
    return (
      <>
        <AccountTreeOutlinedIcon fontSize="small" sx={{ color: "info.main" }} />
        {task.key}
      </>
    );
  }
  const type = TASK_TYPES[task.type];
  return (
    <>
      {type && <type.Icon fontSize="small" sx={{ color: type.tone }} />}
      {task.key}
    </>
  );
};

// The task page's trail: the project › (the parent, for a subtask) › this task's key
const TaskBreadcrumbs = ({ workspace, project, task, parent, sx }) => (
  <Breadcrumbs sx={{ mb: 2, ...sx }}>
    <Link component={RouterLink} to={projectPath(workspace, project)} underline="hover" color="inherit">
      {project.name}
    </Link>
    {parent && (
      <Link
        component={RouterLink}
        to={taskPath(workspace, project, parent.id)}
        underline="hover"
        color="inherit"
        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
      >
        <TaskKey task={parent} />
      </Link>
    )}
    <Typography component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.primary" }}>
      <TaskKey task={task} />
    </Typography>
  </Breadcrumbs>
);

export default TaskBreadcrumbs;

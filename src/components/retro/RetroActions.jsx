import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Paper, Typography } from "@mui/material";
import ToneChip from "../general/ToneChip";
import UserAvatar from "../general/UserAvatar";
import { TASK_STAGES } from "../../constants/tasks";
import { taskPath } from "../../utils/task";

// One action: its task as it is now. A deleted task has only its key left
const ActionRow = ({ task, workspace, project }) => {
  const path = taskPath(workspace, project, task.id);
  const stage = TASK_STAGES[task.statusCategory] ?? TASK_STAGES.TODO;

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        flexWrap: { xs: "wrap", sm: "nowrap" },
        alignItems: "center",
        columnGap: 2,
        rowGap: 0.75,
        px: 2,
        py: 1.25,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {task.deleted ? (
        <>
          <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600, textDecoration: "line-through" }}>
            {task.key}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deleted task
          </Typography>
        </>
      ) : (
        <>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 0 } }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Link
                component={RouterLink}
                to={path}
                color="text.secondary"
                variant="body2"
                sx={{ fontWeight: 600, flexShrink: 0 }}
              >
                {task.key}
              </Link>
              <Link component={RouterLink} to={path} color="text.primary" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                {task.title}
              </Link>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {task.sprintName ?? "Backlog"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { sm: 180 }, minWidth: 0 }}>
            {task.assignee ? (
              <>
                <UserAvatar user={{ userId: task.assignee.id, firstName: task.assignee.name }} size={24} />
                <Typography variant="body2" noWrap title={task.assignee.name}>
                  {task.assignee.name}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Unassigned
              </Typography>
            )}
          </Box>
          <Box sx={{ width: { sm: 120 }, minWidth: 0, ml: { xs: "auto", sm: 0 } }}>
            <ToneChip label={task.statusName} tone={stage.tone} />
          </Box>
        </>
      )}
    </Box>
  );
};

// A list of a retro's actions, each with its task's live status: this retro's, or the unfinished ones of an earlier
// retro. `action` is a control for the top right corner, `emptyText` shows when there are none.
const RetroActions = ({ title, actions, emptyText, action, workspace, project }) => (
  <Paper
    component="section"
    aria-label={title}
    elevation={0}
    sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
  >
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
      <Typography variant="subtitle1" component="h3" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        {title}
      </Typography>
      <ToneChip label={actions.length} />
      {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
    </Box>
    {actions.length > 0 ? (
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {actions.map(({ id, task }) => (
          <ActionRow key={id} task={task} workspace={workspace} project={project} />
        ))}
      </Box>
    ) : (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 2, py: 3, textAlign: "center", borderTop: 1, borderColor: "divider" }}
      >
        {emptyText}
      </Typography>
    )}
  </Paper>
);

export default RetroActions;

import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import TaskComments from "./TaskComments";
import TaskHistory from "./TaskHistory";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { PERMISSIONS } from "../../constants/projects";
import { can, isProjectArchived } from "../../utils/project";
import { isWorkspaceArchived } from "../../utils/workspace";

const tabSx = { minHeight: 40, textTransform: "none", fontWeight: 600, px: 1.5, minWidth: 0 };

// A task page's Activity, like Jira's: Comments (TaskComments, opens first) and History (TaskHistory, the
// activity feed). Used by a task's and a subtask's page; both have their own comments and history.
// `historyVersion` changes after something that writes history without touching the task, like an attachment.
const TaskActivity = ({ project, task, members, historyVersion = 0 }) => {
  const { workspace } = useWorkspaceAccess();
  const [tab, setTab] = useState("comments");
  // Viewers and archived workspaces / projects only read (hiding is for usability, the backend refuses anyway)
  const canComment = can(project, PERMISSIONS.COMMENT) && !isWorkspaceArchived(workspace) && !isProjectArchived(project);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Activity</Typography>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ minHeight: 40, mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="comments" label="Comments" sx={tabSx} />
        <Tab value="history" label="History" sx={tabSx} />
      </Tabs>
      {tab === "history" ? (
        <TaskHistory
          project={project}
          taskId={task.id}
          members={members}
          version={`${task.updatedAt}-${historyVersion}`}
          subtask={task.parentTaskId != null}
        />
      ) : (
        <TaskComments project={project} taskId={task.id} members={members} canComment={canComment} />
      )}
    </Box>
  );
};

export default TaskActivity;

import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import TaskHistory from "./TaskHistory";

const tabSx = { minHeight: 40, textTransform: "none", fontWeight: 600, px: 1.5, minWidth: 0 };

// A task page's Activity, like Jira's: Comments and History tabs. History is the task's activity feed
// (TaskHistory); comments come with their own story, so that tab only says so for now and History opens first.
const TaskActivity = ({ project, task, members }) => {
  const [tab, setTab] = useState("history");

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
          version={task.updatedAt}
          subtask={task.parentTaskId != null}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Comments are coming soon.
        </Typography>
      )}
    </Box>
  );
};

export default TaskActivity;

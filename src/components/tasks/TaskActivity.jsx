import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import TaskHistory from "./TaskHistory";
import TaskComments from "./TaskComments";

const tabSx = { minHeight: 40, textTransform: "none", fontWeight: 600, px: 1.5, minWidth: 0 };

const TaskActivity = ({ project, task, members }) => {
    const [tab, setTab] = useState("comments");

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
                <TaskHistory project={project} taskId={task.id} members={members} />
            ) : (
                <TaskComments projectId={project.id} taskId={task.id} permissions={project.permissions || []} />
            )}
        </Box>
    );
};

export default TaskActivity;
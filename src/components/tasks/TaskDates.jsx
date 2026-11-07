import { Box, Typography } from "@mui/material";

// "Created … / Updated …" under a task page's details
const TaskDates = ({ task }) => (
  <Box sx={{ mt: 2, px: 0.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
      Created {new Date(task.createdAt).toLocaleString()}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
      Updated {new Date(task.updatedAt).toLocaleString()}
    </Typography>
  </Box>
);

export default TaskDates;

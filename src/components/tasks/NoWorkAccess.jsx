import { Paper, Typography } from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

// shown to people who manage the project without seeing its work (a workspace admin who isn't a member)
const NoWorkAccess = () => (
  <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
    <VisibilityOffOutlinedIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      You can't see this project's work
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 480, mx: "auto" }}>
      Workspace admins manage every project, but only see tasks and sprints in projects they are a member of.
      Ask a Project Manager to add you.
    </Typography>
  </Paper>
);

export default NoWorkAccess;

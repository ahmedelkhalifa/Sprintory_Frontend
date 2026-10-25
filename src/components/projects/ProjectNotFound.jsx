import { Link as RouterLink } from "react-router-dom";
import { Button, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Shown when a project returns 404: it doesn't exist, or the user may not see it
// (e.g. they were just removed from it). projects-docs.md §5.2: send them back to the list.
const ProjectNotFound = () => (
  <Paper
    elevation={0}
    sx={{ maxWidth: 520, mx: "auto", mt: { xs: 2, sm: 6 }, p: { xs: 3, sm: 5 }, textAlign: "center",
      border: "1px solid", borderColor: "divider", borderRadius: 2 }}
  >
    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
      Project not found
    </Typography>
    <Typography sx={{ mt: 1, mb: 3, color: "text.secondary" }}>
      It doesn't exist, or you don't have access to it anymore.
    </Typography>
    <Button component={RouterLink} to="/projects" variant="contained" startIcon={<ArrowBackIcon />}>
      Back to projects
    </Button>
  </Paper>
);

export default ProjectNotFound;

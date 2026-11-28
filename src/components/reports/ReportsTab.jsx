import { Link, Navigate, useParams } from "react-router-dom";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { PERMISSIONS } from "../../constants/projects";
import { can, projectPath } from "../../utils/project";
import NoWorkAccess from "../tasks/NoWorkAccess";
import BurndownView from "./BurndownView";

const VIEWS = [
  { id: "burndown", label: "Burndown" },
  { id: "velocity", label: "Velocity" },
];

const ReportsTab = () => {
  const { view = "burndown" } = useParams();
  const { project } = useProjectAccess();
  const { workspace } = useWorkspaceAccess();
  const base = projectPath(workspace, project);

  if (!VIEWS.some((item) => item.id === view)) return <Navigate to={`${base}/reports/burndown`} replace />;
  if (!can(project, PERMISSIONS.VIEW_WORK)) return <NoWorkAccess />;

  return (
    <Stack spacing={2}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={view} aria-label="Reports">
          {VIEWS.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} component={Link} to={`${base}/reports/${item.id}`} />
          ))}
        </Tabs>
      </Box>
      {view === "burndown" ? (
        <BurndownView key={project.id} projectId={project.id} />
      ) : (
        // PMP-165 replaces this with the velocity view
        <Typography color="text.secondary">Velocity is coming soon.</Typography>
      )}
    </Stack>
  );
};

export default ReportsTab;

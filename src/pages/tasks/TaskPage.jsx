import { Link as RouterLink } from "react-router-dom";
import { Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageLayout from "../../components/layouts/PageLayout";
import ComingSoonPanel from "../../components/projects/overview/ComingSoonPanel";
import { projectPath } from "../../utils/project";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";

// /workspaces/:workspaceSlug/projects/:projectId/tasks/:taskId
// TEMP placeholder so the backlog's "Open full page" link lands somewhere; the full task page replaces it.
const TaskPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();

  return (
    <PageLayout>
      <Link
        component={RouterLink}
        to={projectPath(workspace, project)}
        underline="hover"
        color="text.secondary"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14, mb: 2 }}
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to project
      </Link>
      <ComingSoonPanel title="The task page" />
    </PageLayout>
  );
};

export default TaskPage;

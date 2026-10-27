import { Navigate, Outlet, useLocation, useOutletContext, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import PageLayout from "../layouts/PageLayout";
import NotFound from "./NotFound";
import ProjectSkeleton from "../projects/ProjectSkeleton";
import { getWorkspace } from "../../api/workspacesApi";
import { getProject } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { parseProjectId, projectsPath } from "../../utils/project";
import { parseWorkspaceId } from "../../utils/workspace";

// Layout routes that load a workspace / project before anything under them renders, so a page never
// shows for something the user can't see. Pages read what was loaded with useWorkspaceAccess() /
// useProjectAccess(). Hiding is only for navigation; the backend still checks every request.

// a GET answers 404 for "doesn't exist" and for "can't see it", on purpose; 403 is treated the same
const NO_ACCESS = ["RESOURCE_NOT_FOUND", "ACCESS_DENIED"];

// not found / loading / error until the resource is there, then `children`.
// A reload() keeps the old data on screen, so the page stays mounted while it runs.
const AccessState = ({ id, state, notFound, placeholder, children }) => {
  if (!id || NO_ACCESS.includes(state.errorCode)) return <PageLayout>{notFound}</PageLayout>;
  if (state.data) return children;

  return (
    <PageLayout>
      {state.error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={state.reload}>
              Try again
            </Button>
          }
        >
          {state.error}
        </Alert>
      ) : (
        placeholder ?? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )
      )}
    </PageLayout>
  );
};

// /workspaces/:workspaceId/...
export const WorkspaceAccessGuard = () => {
  const workspaceId = parseWorkspaceId(useParams().workspaceId);
  const state = useAsync((signal) => getWorkspace(workspaceId, signal), [workspaceId], {
    enabled: Boolean(workspaceId),
    fallback: "Couldn't load the workspace. Please try again.",
  });

  return (
    <AccessState
      id={workspaceId}
      state={state}
      notFound={<NotFound title="Workspace not found" backTo="/workspaces" backLabel="Back to workspaces" />}
    >
      <Outlet context={{ workspace: state.data, reloadWorkspace: state.reload }} />
    </AccessState>
  );
};

// /workspaces/:workspaceId/projects/:projectId/..., nested under WorkspaceAccessGuard
export const ProjectAccessGuard = () => {
  const params = useParams();
  const location = useLocation();
  // pass the workspace on, so pages under a project can read both
  const parent = useOutletContext();
  const workspaceId = parseWorkspaceId(params.workspaceId);
  const projectId = parseProjectId(params.projectId);
  const state = useAsync((signal) => getProject(projectId, signal), [projectId], {
    enabled: Boolean(projectId),
    fallback: "Couldn't load the project. Please try again.",
  });
  const project = state.data;

  // an old or hand-edited link with the wrong workspace: same page under the project's real one
  if (project && project.workspaceId !== workspaceId) {
    const pathname = location.pathname.replace(/^\/workspaces\/[^/]+/, `/workspaces/${project.workspaceId}`);
    return <Navigate to={{ ...location, pathname }} replace />;
  }

  return (
    <AccessState
      id={projectId}
      state={state}
      placeholder={<ProjectSkeleton />}
      notFound={<NotFound title="Project not found" backTo={projectsPath(workspaceId)} backLabel="Back to projects" />}
    >
      <Outlet context={{ ...parent, project, reloadProject: state.reload }} />
    </AccessState>
  );
};

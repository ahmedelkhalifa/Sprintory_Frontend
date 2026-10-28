import { Navigate, Outlet, useLocation, useOutletContext, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import PageLayout from "../layouts/PageLayout";
import NotFound from "./NotFound";
import ProjectSkeleton from "../projects/ProjectSkeleton";
import { getWorkspace } from "../../api/workspacesApi";
import { getProject } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { parseProjectId, projectsPath } from "../../utils/project";
import { findWorkspace, workspacePath } from "../../utils/workspace";

// Layout routes that load a workspace / project before anything under them renders, so a page never
// shows for something the user can't see. Pages read what was loaded with useWorkspaceAccess() /
// useProjectAccess(). Hiding is only for navigation; the backend still checks every request.

// a GET answers 404 for "doesn't exist" and for "can't see it", on purpose; 403 is treated the same
const NO_ACCESS = ["RESOURCE_NOT_FOUND", "ACCESS_DENIED"];

// the same page under another workspace: /workspaces/<anything>/rest -> /workspaces/<slug>/rest
const underWorkspace = (location, workspace) => ({
  ...location,
  pathname: location.pathname.replace(/^\/workspaces\/[^/]+/, workspacePath(workspace)),
});

// not found / loading / error until the resource is there, then `children`.
// A reload() keeps the old data on screen, so the page stays mounted while it runs.
const AccessState = ({ missing, state, notFound, placeholder, children }) => {
  if (missing || NO_ACCESS.includes(state.errorCode)) return <PageLayout>{notFound}</PageLayout>;
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

// /workspaces/:workspaceSlug/...
// The url has the slug and the API wants the id, so the workspace is first looked up in the user's own
// list (WorkspaceProvider). A slug that isn't there is not found, like the backend's 404 for non-members.
export const WorkspaceAccessGuard = () => {
  const segment = useParams().workspaceSlug;
  const location = useLocation();
  const list = useWorkspaces();
  const { workspace: listed, bySlug } = findWorkspace(list.workspaces, segment);
  const workspaceId = listed?.id ?? null;
  // still loaded by id: the guard's reloadWorkspace() and the 404 when access was lost depend on it
  const state = useAsync((signal) => getWorkspace(workspaceId, signal), [workspaceId], {
    enabled: Boolean(workspaceId),
    fallback: "Couldn't load the workspace. Please try again.",
  });
  const notFound = <NotFound title="Workspace not found" backTo="/workspaces" backLabel="Back to workspaces" />;

  // a link from before slugs (/workspaces/3/...): same page under the slug
  if (listed && !bySlug) return <Navigate to={underWorkspace(location, listed)} replace />;

  if (!listed) {
    // only unknown once the list is in; while it (re)loads, e.g. right after creating a workspace, wait
    const pending = list.loading || list.refreshing || Boolean(list.error);
    const listState = { data: null, error: list.error, errorCode: null, reload: list.reload };
    return <AccessState missing={!pending} state={listState} notFound={notFound} />;
  }

  return (
    <AccessState state={state} notFound={notFound}>
      <Outlet context={{ workspace: state.data, reloadWorkspace: state.reload }} />
    </AccessState>
  );
};

// /workspaces/:workspaceSlug/projects/:projectId/..., nested under WorkspaceAccessGuard
export const ProjectAccessGuard = () => {
  const params = useParams();
  const location = useLocation();
  // pass the workspace on, so pages under a project can read both
  const parent = useOutletContext();
  const { workspaces } = useWorkspaces();
  const projectId = parseProjectId(params.projectId);
  const state = useAsync((signal) => getProject(projectId, signal), [projectId], {
    enabled: Boolean(projectId),
    fallback: "Couldn't load the project. Please try again.",
  });
  const project = state.data;
  const notFound = (
    <NotFound title="Project not found" backTo={projectsPath(parent.workspace)} backLabel="Back to projects" />
  );

  // an old or hand-edited link with the wrong workspace: same page under the project's real one
  if (project && project.workspaceId !== parent.workspace.id) {
    const real = workspaces.find((w) => w.id === project.workspaceId);
    if (real) return <Navigate to={underWorkspace(location, real)} replace />;
    return <PageLayout>{notFound}</PageLayout>;
  }

  return (
    <AccessState
      missing={!projectId}
      state={state}
      placeholder={<ProjectSkeleton />}
      notFound={notFound}
    >
      <Outlet context={{ ...parent, project, reloadProject: state.reload }} />
    </AccessState>
  );
};

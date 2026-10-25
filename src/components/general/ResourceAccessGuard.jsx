import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { Link as RouterLink, Navigate, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";
import { getWorkspace } from "../../api/workspaces";
import { getProject } from "../../api/projects";
import { accessFailure, matchesWorkspace, validResourceId } from "../../utils/routeAccess";

// A positive response from a private-resource endpoint is the membership check.
// The server returns indistinguishable 404s for missing and inaccessible resources.
function ResourceAccess({ kind, resourceId, optional = false, expectedWorkspaceId }) {
  const location = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${kind}:${resourceId}:${attempt}`;
  const validId = validResourceId(resourceId);

  useEffect(() => {
    if (!validId) return undefined;
    const controller = new AbortController();
    const fetchResource = kind === "workspace" ? getWorkspace : getProject;

    fetchResource(resourceId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error });
      });

    return () => controller.abort();
  }, [kind, resourceId, key, validId]);

  // The global Teams page can be opened before a workspace has been selected.
  if (optional && resourceId == null) return <Outlet />;
  if (!validId) {
    return <Alert severity="warning">Invalid {kind} ID. Choose a valid {kind} to continue.</Alert>;
  }

  if (!result || result.key !== key) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress aria-label={`Checking ${kind} access`} /></Box>;
  }

  if (result.error) {
    const failure = accessFailure(result.error);
    if (failure === "login") {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (failure === "denied") {
      return (
        <Alert severity="warning" action={<Button component={RouterLink} to={kind === "project" ? "/projects" : "/workspaces"} color="inherit">Go back</Button>}>
          This {kind} does not exist or you don't have access to it.
        </Alert>
      );
    }
    return (
      <Alert severity="error" action={<Button onClick={() => setAttempt((n) => n + 1)} color="inherit">Retry</Button>}>
        Unable to check {kind} access. Please try again.
      </Alert>
    );
  }

  if (kind === "project" && !matchesWorkspace(result.data, expectedWorkspaceId)) {
    return <Alert severity="warning">This project is not in the requested workspace.</Alert>;
  }

  return <Outlet />;
}

export function WorkspaceAccessGuard({ fromQuery = false }) {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const id = fromQuery ? searchParams.get("workspaceId") : workspaceId;
  return <ResourceAccess kind="workspace" resourceId={id} optional={fromQuery} />;
}

export function ProjectAccessGuard() {
  const { projectId, workspaceId } = useParams();
  return <ResourceAccess kind="project" resourceId={projectId} expectedWorkspaceId={workspaceId} />;
}

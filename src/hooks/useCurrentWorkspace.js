import { listMyWorkspaces } from "../api/workspacesApi";
import { useAsync } from "./useAsync";

// same key as the workspace switcher in the sidebar (branch workspace-page), so both agree on the workspace
const LAST_WORKSPACE_KEY = "lastWorkspaceId";

const readLastWorkspaceId = () => {
  try {
    return localStorage.getItem(LAST_WORKSPACE_KEY);
  } catch {
    return null; // storage can be blocked; fall back to the first workspace
  }
};

// the workspace picked in the switcher, else the first active one, else the first one
const pickWorkspace = (workspaces) =>
  workspaces.find((ws) => String(ws.id) === readLastWorkspaceId()) ??
  workspaces.find((ws) => !ws.isArchived) ??
  workspaces[0] ??
  null;

/**
 * Which workspace the projects pages show. The ONLY place that decides it:
 * change this hook when the app gets a proper "current workspace".
 * const { workspace, loading, error, reload } = useCurrentWorkspace();   // workspace is null if the user has none
 */
export function useCurrentWorkspace() {
  const { data, loading, error, reload } = useAsync(() => listMyWorkspaces().then(pickWorkspace), [], {
    messages: { fallback: "Couldn't load your workspace. Please try again." },
  });
  return { workspace: data, loading, error, reload };
}

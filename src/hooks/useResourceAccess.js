import { useOutletContext } from "react-router-dom";

// what WorkspaceAccessGuard / ProjectAccessGuard loaded for the pages under them.
// Only usable below those guards; the resource is always loaded there, never null.

// { workspace, reloadWorkspace }
export const useWorkspaceAccess = () => {
  const { workspace, reloadWorkspace } = useOutletContext();
  return { workspace, reloadWorkspace };
};

// { project, reloadProject }; reloading after the user lost access shows the not-found screen
export const useProjectAccess = () => {
  const { project, reloadProject } = useOutletContext();
  return { project, reloadProject };
};

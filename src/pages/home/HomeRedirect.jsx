import { Navigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { workspacePath } from "../../utils/workspace";

// `/` (Home, and where the login form lands by default): the current workspace's overview, i.e. the one in the
// url or the last one opened, or the workspace list to pick one first
const HomeRedirect = () => {
  const { loading, current } = useWorkspaces();
  if (loading) return <CircularProgress />;
  return <Navigate to={current ? workspacePath(current) : "/workspaces"} replace />;
};

export default HomeRedirect;

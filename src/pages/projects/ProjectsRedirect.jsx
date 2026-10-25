import { Navigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { projectsPath } from "../../utils/project";

// /projects: projects live under a workspace, so open the current one's list
// (the login form lands here by default), or let the user pick a workspace first
const ProjectsRedirect = () => {
  const { loading, currentId } = useWorkspaces();
  if (loading) return <CircularProgress />;
  return <Navigate to={currentId ? projectsPath(currentId) : "/workspaces"} replace />;
};

export default ProjectsRedirect;

import { Navigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { isWorkspaceAdmin, workspacePath } from "../../utils/workspace";

// /backlog: the sidebar's old Backlog entry is now "Audit Log". The log lives under a workspace, so open the
// current workspace's page (admins only); without one, let the user pick a workspace first
const AuditLogRedirect = () => {
  const { loading, current } = useWorkspaces();
  if (loading) return <CircularProgress />;
  if (!current) return <Navigate to="/workspaces" replace />;
  return <Navigate to={isWorkspaceAdmin(current) ? `${workspacePath(current)}/audit-log` : workspacePath(current)} replace />;
};

export default AuditLogRedirect;

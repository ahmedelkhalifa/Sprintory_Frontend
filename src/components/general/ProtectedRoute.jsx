import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import { invitePath, pendingInvite } from "../../utils/invitation";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    // remember where they were going so login can send them back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // an invitee who left the accept page to sign in or register goes back there first;
  // this also catches Google sign-in, which always lands on "/"
  const invite = pendingInvite();
  if (invite) return <Navigate to={invitePath(invite)} replace />;

  return <Outlet />; // render the child routes only while logged in
};

export default ProtectedRoute;
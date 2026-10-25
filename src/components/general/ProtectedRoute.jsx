import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

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
    // Remember the requested URL so login can return there.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render children only while authenticated.
};

export default ProtectedRoute;
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
    // rembmers where they were going so a login send them back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

    return <Outlet />; // render the child routes if the user is authenticated
};

export default ProtectedRoute;
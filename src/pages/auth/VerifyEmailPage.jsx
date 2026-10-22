import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Link, Stack, Typography } from "@mui/material";
import AuthLayout from "../../components/layouts/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import { verifyEmail } from "../../api/authApi";

const INVALID_LINK = "This link has expired or was already used.";

// Opened from the activation email: /verify-email?token=...
const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState(token ? "" : INVALID_LINK);
  // the token works only once, and StrictMode runs effects twice in dev
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;

    verifyEmail(token)
      .then(() => navigate("/login", { replace: true, state: { verified: true } }))
      .catch((err) => {
        const code = err.response?.data?.code;
        if (code === "INVALID_TOKEN" || code === "VALIDATION_ERROR") setError(INVALID_LINK);
        else if (!err.response) setError("Can't reach the server. Please try again.");
        else setError(err.response.data?.message || "Something went wrong. Please try again.");
      });
  }, [token, navigate]);

  if (error) {
    return (
      <AuthLayout>
        <AuthCard title="Activation failed">
          <Stack spacing={2} sx={{ mt: 2.5 }}>
            <Alert severity="error">{error}</Alert>
            <Typography variant="body2" color="text.secondary">
              <Link component={RouterLink} to="/register" underline="hover">
                Register again
              </Link>{" "}
              with the same email to get a new link.
            </Typography>
          </Stack>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard title="Activating your account" subtitle="This only takes a moment.">
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress />
        </Box>
      </AuthCard>
    </AuthLayout>
  );
};

export default VerifyEmailPage;

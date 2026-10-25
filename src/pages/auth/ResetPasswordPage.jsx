import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import AuthLayout from "../../components/layouts/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

// /reset-password            -> ask for the email, then "check your inbox"
// /reset-password?token=...  -> opened from the email: choose a new password
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [sent, setSent] = useState(false);
  // kept so "send it again" opens the form with the email already filled in
  const [email, setEmail] = useState("");

  if (token) {
    return (
      <AuthLayout>
        <AuthCard title="Choose a new password" subtitle="You'll be signed out on all your devices.">
          <ResetPasswordForm token={token} />
        </AuthCard>
      </AuthLayout>
    );
  }

  if (sent) {
    return (
      <AuthLayout>
        <AuthCard title="Check your email" subtitle="One more step to reset your password.">
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "action.hover",
                color: "primary.main",
              }}
            >
              <MarkEmailReadOutlinedIcon fontSize="large" />
            </Box>

            {/* the backend answers the same for unknown emails, so don't promise an email arrived */}
            <Typography>
              If <strong>{email}</strong> has a Sprintory account, we sent it a link to reset your password.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              The link expires in 24 hours. Didn't get it? Check your spam folder, or{" "}
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => setSent(false)}
                sx={{ verticalAlign: "baseline" }}
              >
                send it again
              </Link>
              .
            </Typography>

            <Button component={RouterLink} to="/login" variant="contained" fullWidth>
              Back to sign in
            </Button>
          </Stack>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard title="Reset your password" subtitle="Enter your email and we'll send you a link to reset it.">
        <ForgotPasswordForm
          initialEmail={email}
          onSent={(sentTo) => {
            setEmail(sentTo);
            setSent(true);
          }}
        />
      </AuthCard>
    </AuthLayout>
  );
};

export default ResetPasswordPage;

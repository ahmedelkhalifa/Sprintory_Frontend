import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import AuthLayout from "../../components/layouts/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";

// Shown right after registering: the account stays inactive until the emailed link is opened
const ActivateAccountPage = () => {
  // passed by RegisterForm; missing if the page is opened directly
  const email = useLocation().state?.email;

  return (
    <AuthLayout>
      <AuthCard title="Activate your account" subtitle="One more step before you can sign in.">
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
            <MarkEmailUnreadOutlinedIcon fontSize="large" />
          </Box>

          <Typography>
            We sent an activation link to {email ? <strong>{email}</strong> : "your email address"}.
            Open it to activate your account.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The link expires in 24 hours. Didn't get it? Check your spam folder, or{" "}
            <Link component={RouterLink} to="/register" underline="hover">
              register again
            </Link>{" "}
            with the same email to get a new link.
          </Typography>

          <Button component={RouterLink} to="/login" variant="contained" fullWidth>
            Back to sign in
          </Button>
        </Stack>
      </AuthCard>
    </AuthLayout>
  );
};

export default ActivateAccountPage;

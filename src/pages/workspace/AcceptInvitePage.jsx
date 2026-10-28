import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import AuthLayout from "../../components/layouts/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import { useAuth } from "../../context/AuthContext";
import { acceptInvitation, lookupInvitation } from "../../api/workspacesApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { errorCode } from "../../utils/apiError";
import { clearPendingInvite, sameEmail, savePendingInvite } from "../../utils/invitation";
import { workspacePath } from "../../utils/workspace";

const EXPIRED = "This invitation has expired or was already used.";
const DEAD_LINK_CODES = ["RESOURCE_NOT_FOUND", "VALIDATION_ERROR"];
const LOOKUP_MESSAGES = { RESOURCE_NOT_FOUND: EXPIRED, VALIDATION_ERROR: EXPIRED };
const ACCEPT_MESSAGES = {
  RESOURCE_NOT_FOUND: EXPIRED,
  ACCESS_DENIED: "This invitation was sent to a different email address.",
  WORKSPACE_ARCHIVED: "This workspace is archived, so nobody can join it right now. Ask an admin to restore it.",
};

// Opened from the invitation email: /accept-invite?token=...
// Public, because the invitee may not be signed in (or have an account) yet.
const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, loading: authLoading, logout } = useAuth();
  const lookup = useAsync((signal) => lookupInvitation(token, signal), [token], {
    enabled: Boolean(token),
    messages: LOOKUP_MESSAGES,
  });
  const submit = useSubmit(ACCEPT_MESSAGES);
  const [usedUp, setUsedUp] = useState(false);

  const expired = !token || usedUp || DEAD_LINK_CODES.includes(lookup.errorCode);

  // nothing left to come back to: the invitee is back here signed in, or the link is dead
  useEffect(() => {
    if (expired || user) clearPendingInvite();
  }, [expired, user]);

  // keep the token so they land here again after login, or after register + verify + login
  const leaveTo = (path, state) => {
    savePendingInvite(token);
    navigate(path, { state });
  };

  const handleAccept = async () => {
    const { ok, result, error } = await submit.run(() => acceptInvitation(token));
    if (ok) navigate(workspacePath(result), { replace: true });
    else if (errorCode(error) === "RESOURCE_NOT_FOUND") setUsedUp(true);
  };

  if (expired) {
    return (
      <AuthLayout>
        <AuthCard title="Invitation not valid">
          <Stack spacing={2} sx={{ mt: 2.5 }}>
            <Alert severity="error">{EXPIRED}</Alert>
            <Typography variant="body2" color="text.secondary">
              Ask a workspace admin to invite you again. A new invitation replaces the old link.
            </Typography>
            <Button component={RouterLink} to={user ? "/workspaces" : "/login"} variant="contained" fullWidth>
              {user ? "Go to your workspaces" : "Back to sign in"}
            </Button>
          </Stack>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (lookup.error) {
    return (
      <AuthLayout>
        <AuthCard title="Couldn't open the invitation">
          <Stack spacing={2} sx={{ mt: 2.5 }}>
            <Alert severity="error">{lookup.error}</Alert>
            <Button variant="contained" fullWidth onClick={lookup.reload}>
              Try again
            </Button>
          </Stack>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (lookup.loading || authLoading) {
    return (
      <AuthLayout>
        <AuthCard title="Opening your invitation" subtitle="This only takes a moment.">
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress />
          </Box>
        </AuthCard>
      </AuthLayout>
    );
  }

  const { workspaceName, email } = lookup.data;
  // checked up front so the user isn't sent into a 403; the backend checks again on accept
  const wrongAccount = Boolean(user?.email) && !sameEmail(user.email, email);

  return (
    <AuthLayout>
      <AuthCard title={`Join ${workspaceName}?`}>
        <Stack spacing={2} sx={{ mt: 2.5, alignItems: "center", textAlign: "center" }}>
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
            <GroupAddOutlinedIcon fontSize="large" />
          </Box>

          <Typography>
            You were invited to join the <strong>{workspaceName}</strong> workspace on Sprintory as{" "}
            <strong>{email}</strong>.
          </Typography>

          {!user && (
            <>
              <Typography variant="body2" color="text.secondary">
                Sign in with this email to join, or create an account with it if you don&apos;t have one.
                Google sign-in works too, if your Google account uses this email.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => leaveTo("/login", { from: location, email })}
              >
                Sign in to join
              </Button>
              <Button variant="outlined" fullWidth onClick={() => leaveTo("/register", { email })}>
                Create an account
              </Button>
            </>
          )}

          {user && wrongAccount && (
            <>
              <Alert severity="warning" sx={{ width: "100%", textAlign: "left" }}>
                You&apos;re signed in as <strong>{user.email}</strong>. Sign out and continue with{" "}
                <strong>{email}</strong> to join.
              </Alert>
              {/* once signed out this page shows the sign in / create account choice */}
              <Button variant="contained" fullWidth onClick={logout}>
                Sign out and switch account
              </Button>
              <Button component={RouterLink} to="/workspaces" fullWidth>
                Not now
              </Button>
            </>
          )}

          {user && !wrongAccount && (
            <>
              {submit.error && (
                <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
                  {submit.error}
                </Alert>
              )}
              <Button variant="contained" fullWidth loading={submit.submitting} onClick={handleAccept}>
                Join workspace
              </Button>
              <Button component={RouterLink} to="/workspaces" fullWidth disabled={submit.submitting}>
                Not now
              </Button>
            </>
          )}
        </Stack>
      </AuthCard>
    </AuthLayout>
  );
};

export default AcceptInvitePage;

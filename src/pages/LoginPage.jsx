import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowForwardRounded,
  EmailOutlined,
  LanguageOutlined,
  LockOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
  KeyboardArrowDownRounded,
} from "@mui/icons-material";
import { signInWithEmail } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

// Ahmed's login background image lives at public/images/Login.png.
// Copy the supplied photo there before starting Vite.
const HERO_IMAGE = "/images/Login.png";

// Dense desktop layouts need tighter vertical spacing without reducing touch targets on phones.
const SHORT_DESKTOP = "@media (min-width: 1200px) and (max-height: 840px)";

function Brand({ compact = false }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.4}>
      {/* Temporary lettermark until the official Sprintory logo is available. */}
      <Box
        aria-hidden="true"
        sx={{
          width: compact ? 30 : 38,
          height: compact ? 30 : 38,
          borderRadius: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "grid",
          placeItems: "center",
          fontSize: compact ? "1.25rem" : "1.55rem",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        S
      </Box>
      <Typography
        component="span"
        sx={{
          fontSize: compact ? "1.4rem" : "1.85rem",
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          color: "text.primary",
        }}
      >
        Sprintory
      </Typography>
    </Stack>
  );
}

function LoginHero() {
  return (
    <Box
      component="section"
      aria-label="About Sprintory"
      sx={{
        display: { xs: "none", lg: "flex" },
        minWidth: 0,
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        pt: { lg: 5, xl: 6 },
        pb: { lg: 4, xl: 6 },
        pl: { lg: "clamp(64px, 5.6vw, 112px)" },
        pr: { lg: 3.5, xl: 5 },
        backgroundColor: "background.default",
        // Preserve the original photo; readability comes from keeping copy on its clear wall area.
        backgroundImage: `url("${HERO_IMAGE}")`,
        [SHORT_DESKTOP]: { pt: 4, pb: 3 },
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <Brand />

      <Box sx={{ mt: { lg: 9, xl: 9.5 }, maxWidth: "100%", [SHORT_DESKTOP]: { mt: 7 } }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: { lg: "0.8rem", xl: "0.9rem" },
            fontWeight: 700,
            letterSpacing: "0.34em",
            color: "text.secondary",
          }}
        >
          Plan. Collaborate. Deliver.
        </Typography>
        <Typography
          component="h1"
          sx={{
            mt: 3,
            fontSize: { lg: "clamp(2.6rem, 3.5vw, 4.55rem)", xl: "clamp(3.55rem, 4vw, 4.8rem)" },
            lineHeight: 1.07,
            overflowWrap: "break-word",
            [SHORT_DESKTOP]: { mt: 2.25 },
            fontWeight: 800,
            letterSpacing: "-0.045em",
            color: "text.primary",
          }}
        >
          Turn ideas into
          <Box component="span" sx={{ display: "block", color: "primary.main" }}>
            successful projects
          </Box>
        </Typography>
        <Typography
          sx={{
            mt: 3.5,
            // On narrower desktops, stop the paragraph before the busy plant/window area.
            // Wider screens have more free wall space for the original copy layout.
            maxWidth: { lg: "min(100%, 340px)", xl: "min(100%, 460px)" },
            fontSize: { lg: "clamp(1rem, 1.2vw, 1.25rem)" },
            lineHeight: 1.58,
            color: "text.secondary",
            [SHORT_DESKTOP]: { mt: 2.5 },
          }}
        >
          Sprintory helps teams plan, collaborate, and deliver with clarity. From tasks
          and sprints to AI insights, everything you need to move your projects forward
          — in one place.
        </Typography>
      </Box>
    </Box>
  );
}

function loginErrorMessage(error) {
  if (!error.response) {
    return error.isAxiosError
      ? "Cannot connect to the authentication server. Please try again later."
      : "Could not complete sign-in. Please try again.";
  }
  if (error.response.status === 401) {
    return "Invalid email or password.";
  }
  // Backend may return a dedicated error code when an email requires Google sign-in.
  if (error.response.data?.code === "GOOGLE_SIGN_IN_REQUIRED") {
    return "This account uses Google sign-in. Please continue with Google.";
  }
  return "Unable to sign in. Please try again.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setFeedback(null);
    setSubmitting(true);

    try {
      const user = await signInWithEmail({ email: email.trim(), password, rememberMe });
      if (!user || typeof user !== "object") {
        throw new Error("The authentication service did not return a user.");
      }
      setUser(user);
      const from = location.state?.from;
      const destination = from
        ? `${from.pathname}${from.search || ""}${from.hash || ""}`
        : "/projects";
      navigate(destination, { replace: true });
    } catch (error) {
      setFeedback({ severity: "error", message: loginErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "54.5% 45.5%" } }}>
      <LoginHero />
      <Box
        component="main"
        sx={{
          minWidth: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "background.default",
          px: { xs: 2, sm: 3, md: 4, lg: 3.5 },
          pb: { xs: 2.5, sm: 4, lg: 4 },
          [SHORT_DESKTOP]: { pb: 2 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 720,
            display: "flex",
            justifyContent: { xs: "space-between", lg: "flex-end" },
            alignItems: "center",
            py: { xs: 2.5, sm: 3, lg: 3 },
            [SHORT_DESKTOP]: { py: 2 },
          }}
        >
          <Box sx={{ display: { xs: "block", lg: "none" } }}><Brand compact /></Box>
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: "text.primary" }}>
            <LanguageOutlined fontSize="small" />
            <Typography variant="body1" fontWeight={600}>English</Typography>
            <KeyboardArrowDownRounded fontSize="small" />
          </Stack>
        </Box>

        <Paper
          component="section"
          aria-labelledby="login-title"
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 720,
            // On phones, share leftover vertical space above and below the form.
            // When the viewport is short, auto margins collapse and scrolling remains available.
            mt: { xs: "auto", sm: 3, md: "clamp(32px, 7vh, 72px)", lg: "auto" },
            mb: { xs: "auto", sm: 4, lg: "auto" },
            p: { xs: 2.5, sm: 4, md: 5, lg: 6, xl: 7.5 },
            [SHORT_DESKTOP]: { p: 4 },
            borderRadius: 3,
            border: 0,
            bgcolor: "background.paper",
            boxShadow: (theme) => `0 12px 40px ${alpha(theme.palette.text.primary, 0.07)}`,
          }}
        >
          <Typography id="login-title" component="h2" sx={{ fontWeight: 800, fontSize: { xs: "1.9rem", sm: "2.4rem", lg: "2.55rem", xl: "2.8rem" }, lineHeight: 1.16, letterSpacing: "-0.035em", [SHORT_DESKTOP]: { fontSize: "2.3rem" } }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.25, mb: { xs: 3, sm: 3.5, lg: 3.5 }, fontSize: { xs: "0.98rem", sm: "1.05rem" }, lineHeight: 1.5, [SHORT_DESKTOP]: { mb: 2.25 } }}>
            Sign in to your Sprintory account and continue building great projects with your team.
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<Box component="img" src="/images/google-g.png" alt="" aria-hidden="true" sx={{ width: 22, height: 22, display: "block" }} />}
            sx={{ minHeight: { xs: 48, sm: 52, lg: 54 }, borderColor: "divider", color: "text.primary", bgcolor: "background.paper", fontWeight: 600, fontSize: "1rem", [SHORT_DESKTOP]: { minHeight: 48 } }}
            onClick={() => setFeedback({ severity: "info", message: "Google sign-in will be available when the authentication service is connected." })}
          >
            Continue with Google
          </Button>
          <Divider sx={{ my: { xs: 2.5, sm: 3, lg: 3.25 }, color: "text.secondary", [SHORT_DESKTOP]: { my: 2.25 } }}>or</Divider>

          <Box component="form" onSubmit={submit}>
            <Stack spacing={{ xs: 2.5, sm: 2.75, lg: 3 }}>
              <Box>
                <Typography component="label" htmlFor="login-email" sx={{ display: "block", mb: 0.75, fontWeight: 600, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
                  Email address
                </Typography>
                <TextField
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  fullWidth
                  required
                  disabled={submitting}
                  sx={{ "& .MuiOutlinedInput-root": { minHeight: { xs: 48, sm: 52, lg: 56 }, [SHORT_DESKTOP]: { minHeight: 48 } } }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlined fontSize="small" /></InputAdornment> } }}
                />
              </Box>
              <Box>
                <Typography component="label" htmlFor="login-password" sx={{ display: "block", mb: 0.75, fontWeight: 600, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
                  Password
                </Typography>
                <TextField
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  fullWidth
                  required
                  disabled={submitting}
                  sx={{ "& .MuiOutlinedInput-root": { minHeight: { xs: 48, sm: 52, lg: 56 }, [SHORT_DESKTOP]: { minHeight: 48 } } }}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            size="small"
                            edge="end"
                            onClick={() => setShowPassword((value) => !value)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                          >
                            {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Stack>

            <Box
              sx={{
                mt: { xs: 2.5, sm: 3, lg: 3 },
                mb: { xs: 3, sm: 3.5, lg: 3.5 },
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                columnGap: 1,
                rowGap: 1,
                [SHORT_DESKTOP]: { mt: 2, mb: 2.5 },
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={submitting}
                    size="small"
                    sx={{ p: 0.5, mr: 0.75 }}
                  />
                }
                label={<Typography color="text.secondary" sx={{ whiteSpace: "nowrap", fontSize: "0.9rem" }}>Keep me signed in</Typography>}
                sx={{ ml: 0, mr: 0 }}
              />
              {/* The reset-password page is owned by another teammate. */}
              <Link
                component={RouterLink}
                to="/reset-password"
                variant="body2"
                underline="hover"
                sx={{ fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", ml: "auto" }}
              >
                Forgot password?
              </Link>
            </Box>

            {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback.message}</Alert>}

            <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} endIcon={!submitting && <ArrowForwardRounded />} sx={{ minHeight: { xs: 52, sm: 56, lg: 58 }, fontSize: "1.05rem", boxShadow: 1, [SHORT_DESKTOP]: { minHeight: 50 } }}>
              {submitting ? <><CircularProgress color="inherit" size={18} sx={{ mr: 1.5 }} />Signing in...</> : "Sign in"}
            </Button>
          </Box>

          <Box sx={{ mt: { xs: 3.5, sm: 4, lg: 4.5 }, textAlign: "center", [SHORT_DESKTOP]: { mt: 3 } }}>
            <Typography component="span" color="text.secondary" sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>Don&apos;t have an account?</Typography>
            <Link component={RouterLink} to="/register" underline="hover" sx={{ ml: 1, fontSize: { xs: "0.9rem", sm: "1rem" }, fontWeight: 700 }}>Create account</Link>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

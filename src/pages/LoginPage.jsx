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
      sx={(theme) => ({
        display: { xs: "none", lg: "flex" },
        minWidth: 0,
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        pt: { md: 5, xl: 6 },
        pb: { md: 5, xl: 6 },
        pl: { md: 7, lg: "clamp(72px, 7vw, 120px)" },
        pr: { md: 4, lg: 5 },
        backgroundColor: "background.default",
        backgroundImage: `linear-gradient(90deg, ${alpha(theme.palette.background.paper, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0)} 72%), url("${HERO_IMAGE}")`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      })}
    >
      <Brand />

      <Box sx={{ mt: { md: 9, lg: 9.5 }, maxWidth: 640 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: { md: "0.82rem", lg: "0.9rem" },
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
            fontSize: { md: "clamp(3rem, 4vw, 4.55rem)", xl: "4.8rem" },
            lineHeight: 1.07,
            fontWeight: 800,
            letterSpacing: "-0.045em",
            color: "text.primary",
          }}
        >
          Turn ideas into{" "}
          <Box component="span" sx={{ color: "primary.main" }}>
            successful projects
          </Box>
        </Typography>
        <Typography
          sx={{
            mt: 3.5,
            maxWidth: 510,
            fontSize: { md: "1.13rem", lg: "1.25rem" },
            lineHeight: 1.58,
            color: "text.secondary",
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
          px: { xs: 2, sm: 4, lg: 3.5 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 720,
            display: "flex",
            justifyContent: { xs: "space-between", lg: "flex-end" },
            alignItems: "center",
            py: { xs: 3, md: 4 },
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
            my: "auto",
            p: { xs: 3, sm: 5, lg: 7.5 },
            borderRadius: 3,
            border: 0,
            bgcolor: "background.paper",
            boxShadow: (theme) => `0 12px 40px ${alpha(theme.palette.text.primary, 0.07)}`,
          }}
        >
          <Typography id="login-title" component="h2" sx={{ fontWeight: 800, fontSize: { xs: "1.9rem", sm: "2.8rem" }, lineHeight: 1.16, letterSpacing: "-0.035em" }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.25, mb: 4.2, fontSize: "1.14rem", lineHeight: 1.48 }}>
            Sign in to your Sprintory account and continue building great projects with your team.
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<Box component="img" src="/images/google-g.png" alt="" aria-hidden="true" sx={{ width: 22, height: 22, display: "block" }} />}
            sx={{ minHeight: 58, borderColor: "divider", color: "text.primary", bgcolor: "background.paper", fontWeight: 600, fontSize: "1rem" }}
            onClick={() => setFeedback({ severity: "info", message: "Google sign-in will be available when the authentication service is connected." })}
          >
            Continue with Google
          </Button>
          <Divider sx={{ my: 4, color: "text.secondary" }}>or</Divider>

          <Box component="form" onSubmit={submit}>
            <Stack spacing={3.8}>
              <Box>
                <Typography component="label" htmlFor="login-email" sx={{ display: "block", mb: 1, fontWeight: 600, fontSize: "1rem" }}>
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
                  sx={{ "& .MuiOutlinedInput-root": { minHeight: 60 } }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlined fontSize="small" /></InputAdornment> } }}
                />
              </Box>
              <Box>
                <Typography component="label" htmlFor="login-password" sx={{ display: "block", mb: 1, fontWeight: 600, fontSize: "1rem" }}>
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
                  sx={{ "& .MuiOutlinedInput-root": { minHeight: 60 } }}
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
                mt: 3.25,
                mb: 4.25,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: { xs: 1, sm: 2 },
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
                label={<Typography color="text.secondary" sx={{ whiteSpace: "nowrap", fontSize: "0.95rem" }}>Keep me signed in</Typography>}
                sx={{ ml: 0, mr: 0 }}
              />
              {/* The reset-password page is owned by another teammate. */}
              <Link
                component={RouterLink}
                to="/reset-password"
                variant="body2"
                underline="hover"
                sx={{ fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap", ml: { sm: "auto" } }}
              >
                Forgot password?
              </Link>
            </Box>

            {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback.message}</Alert>}

            <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} endIcon={!submitting && <ArrowForwardRounded />} sx={{ minHeight: 64, fontSize: "1.12rem", boxShadow: 1 }}>
              {submitting ? <><CircularProgress color="inherit" size={18} sx={{ mr: 1.5 }} />Signing in...</> : "Sign in"}
            </Button>
          </Box>

          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography component="span" color="text.secondary" sx={{ fontSize: "1rem" }}>Don&apos;t have an account?</Typography>
            <Link component={RouterLink} to="/register" underline="hover" sx={{ ml: 1, fontSize: "1rem", fontWeight: 700 }}>Create account</Link>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

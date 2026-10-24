import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Checkbox, FormControlLabel, Link, Stack, Typography } from "@mui/material";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { signInWithEmail, continueWithGoogle } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { validateLogin } from "../../utils/validation";
import FormField from "../forms/FormField";
import PasswordField from "../forms/PasswordField";
import GoogleButton from "./GoogleButton";
import OrDivider from "./OrDivider";
import { SHORT_SCREEN } from "../../theme/media";

const INITIAL_VALUES = { email: "", password: "" };

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // VerifyEmailPage sends the user here with state.verified after activation
  const [showVerified, setShowVerified] = useState(Boolean(location.state?.verified));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // clear the field's error while the user is fixing it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // validate one field when the user leaves it
  const handleBlur = (e) => {
    const { name } = e.target;
    const fieldError = validateLogin(values)[name] || "";
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setShowVerified(false);

    const validationErrors = validateLogin(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await signInWithEmail({ ...values, email: values.email.trim(), rememberMe });
      setUser(user);
      // go back to the page ProtectedRoute sent us away from
      const from = location.state?.from;
      const destination = from ? `${from.pathname}${from.search}${from.hash}` : "/projects";
      navigate(destination, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setServerError("Can't reach the server. Please try again.");
      } else if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
        setErrors(data.fieldErrors);
      } else if (data?.code === "PROVIDER_MISMATCH") {
        // the Google button is right above the form
        setErrors({ email: data.message });
      } else {
        // e.g. AUTHENTICATION_ERROR for wrong credentials, the backend message is safe to show
        setServerError(data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // shared props for every field
  const fieldProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: Boolean(errors[name]),
    helperText: errors[name],
  });

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      {showVerified && (
        <Alert severity="success" onClose={() => setShowVerified(false)} sx={{ mb: 2 }}>
          Your account is activated. You can sign in now.
        </Alert>
      )}

      <GoogleButton onClick={continueWithGoogle} />
      <OrDivider />

      <Stack spacing={1.75} sx={{ [SHORT_SCREEN]: { gap: 1.25 } }} useFlexGap>
        <FormField
          {...fieldProps("email")}
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<MailOutlinedIcon fontSize="small" />}
        />

        <PasswordField
          {...fieldProps("password")}
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label="Keep me signed in"
            slotProps={{ typography: { fontSize: 14, color: "text.secondary" } }}
            sx={{ ml: -0.75, mr: 0 }}
          />
          {/* TODO: the reset-password page is owned by another teammate */}
          <Link
            component={RouterLink}
            to="/reset-password"
            underline="hover"
            sx={{ fontSize: 14, fontWeight: 600, ml: "auto" }}
          >
            Forgot password?
          </Link>
        </Box>

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={submitting}
          endIcon={<ArrowForwardIcon />}
          sx={{ py: 1.1, fontSize: 16 }}
        >
          Sign in
        </Button>
      </Stack>

      <Typography
        sx={{ mt: 2, textAlign: "center", fontSize: 15, color: "text.secondary", [SHORT_SCREEN]: { mt: 1.5 } }}
      >
        Don&apos;t have an account?{" "}
        <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 600, ml: 0.5 }}>
          Create account
        </Link>
      </Typography>
    </Box>
  );
};

export default LoginForm;

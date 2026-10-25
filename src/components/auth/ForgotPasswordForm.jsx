import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { requestPasswordReset } from "../../api/authApi";
import { validateEmail } from "../../utils/validation";
import FormField from "../forms/FormField";

// Step 1 of the reset: ask for the email. onSent(email) is called once the backend accepted it
const ForgotPasswordForm = ({ initialEmail = "", onSent }) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      onSent(email.trim());
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setServerError("Can't reach the server. Please try again.");
      } else if (data?.code === "VALIDATION_ERROR" && data.fieldErrors?.email) {
        setError(data.fieldErrors.email);
      } else {
        setServerError(data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Stack spacing={2} useFlexGap>
        <FormField
          id="email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          icon={<MailOutlinedIcon fontSize="small" />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          onBlur={() => setError(validateEmail(email))}
          error={Boolean(error)}
          helperText={error}
        />

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={submitting}
          endIcon={<ArrowForwardIcon />}
          sx={{ py: 1.1, fontSize: 16 }}
        >
          Send reset link
        </Button>
      </Stack>

      <Typography sx={{ mt: 2, textAlign: "center", fontSize: 15, color: "text.secondary" }}>
        Remembered it?{" "}
        <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600, ml: 0.5 }}>
          Back to sign in
        </Link>
      </Typography>
    </Box>
  );
};

export default ForgotPasswordForm;

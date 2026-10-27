import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Link, Stack } from "@mui/material";
import { resetPassword } from "../../api/authApi";
import { validateResetPassword } from "../../utils/validation";
import PasswordField from "../forms/PasswordField";

const INITIAL_VALUES = { newPassword: "", confirmPassword: "" };

// Step 2 of the reset, opened from the email link: choose the new password
const ResetPasswordForm = ({ token }) => {
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // clear the field's error while the user is fixing it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // validate one field when the user leaves it
  const handleBlur = (e) => {
    const { name } = e.target;
    const fieldError = validateResetPassword(values)[name] || "";
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validateResetPassword(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: values.newPassword });
      // resetting logs the user out everywhere, so they sign in again with the new password
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setServerError("Can't reach the server. Please try again.");
      } else if (data?.code === "INVALID_TOKEN") {
        // expired, already used, or replaced by a newer link
        setLinkInvalid(true);
      } else if (data?.code === "VALIDATION_ERROR" && data.fieldErrors?.newPassword) {
        setErrors({ newPassword: data.fieldErrors.newPassword });
      } else if (data?.code === "VALIDATION_ERROR" && data.fieldErrors?.token) {
        setLinkInvalid(true);
      } else {
        setServerError(data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (linkInvalid) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">This link has expired or was already used.</Alert>
        <Button component={RouterLink} to="/reset-password" variant="contained" fullWidth>
          Get a new link
        </Button>
      </Stack>
    );
  }

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
      <Stack spacing={2} useFlexGap>
        <PasswordField
          {...fieldProps("newPassword")}
          label="New password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          autoFocus
        />
        <PasswordField
          {...fieldProps("confirmPassword")}
          label="Confirm new password"
          placeholder="Type it again"
          autoComplete="new-password"
        />

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Button type="submit" variant="contained" fullWidth loading={submitting} sx={{ py: 1.1, fontSize: 16 }}>
          Set new password
        </Button>

        <Link component={RouterLink} to="/login" underline="hover" sx={{ textAlign: "center", fontWeight: 600 }}>
          Back to sign in
        </Link>
      </Stack>
    </Box>
  );
};

export default ResetPasswordForm;

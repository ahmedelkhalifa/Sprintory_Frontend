import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { signUp, continueWithGoogle } from "../../api/authApi";
import { validateRegister } from "../../utils/validation";
import FormField from "../forms/FormField";
import PasswordField from "../forms/PasswordField";
import GoogleButton from "./GoogleButton";
import OrDivider from "./OrDivider";
import { SHORT_SCREEN } from "../../theme/media";

const INITIAL_VALUES = { firstName: "", lastName: "", email: "", password: "" };

const RegisterForm = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
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
    const fieldError = validateRegister(values)[name] || "";
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validateRegister(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    const payload = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    };
    try {
      await signUp(payload);
      // the account is inactive until the emailed link is opened
      navigate("/activate-account", { state: { email: payload.email } });
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setServerError("Can't reach the server. Please try again.");
      } else if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
        setErrors(data.fieldErrors);
      } else if (data?.code === "CONFLICT") {
        setErrors({ email: "An account with this email already exists" });
      } else if (data?.code === "PROVIDER_MISMATCH") {
        // the Google button is right above the form
        setErrors({ email: data.message });
      } else {
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
      <GoogleButton onClick={continueWithGoogle} />
      <OrDivider />

      <Stack spacing={1.75} sx={{ [SHORT_SCREEN]: { gap: 1.25 } }} useFlexGap>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap>
          <FormField
            {...fieldProps("firstName")}
            label="First name"
            placeholder="John"
            autoComplete="given-name"
            icon={<PersonOutlinedIcon fontSize="small" />}
          />
          <FormField
            {...fieldProps("lastName")}
            label="Last name"
            placeholder="Doe"
            autoComplete="family-name"
            icon={<PersonOutlinedIcon fontSize="small" />}
          />
        </Stack>

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
          placeholder="Create a strong password"
          autoComplete="new-password"
        />

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={submitting}
          endIcon={<ArrowForwardIcon />}
          sx={{ py: 1.1, mt: 0.5, fontSize: 16 }}
        >
          Create account
        </Button>
      </Stack>

      <Typography
        sx={{ mt: 2, textAlign: "center", fontSize: 15, color: "text.secondary", [SHORT_SCREEN]: { mt: 1.5 } }}
      >
        Already have an account?{" "}
        <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600, ml: 0.5 }}>
          Sign in
        </Link>
      </Typography>

      {/* TODO: point these to the real pages once they exist */}
      <Typography
        variant="caption"
        component="p"
        sx={{ mt: 1.5, textAlign: "center", color: "text.secondary", [SHORT_SCREEN]: { mt: 1 } }}
      >
        By creating an account, you agree to our{" "}
        <Link href="#">Terms of Service</Link> and <Link href="#">Privacy Policy</Link>.
      </Typography>
    </Box>
  );
};

export default RegisterForm;

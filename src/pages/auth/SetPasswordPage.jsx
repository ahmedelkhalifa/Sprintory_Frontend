import {
    Box, Card, Typography, TextField, Button, Alert, CircularProgress,
    InputAdornment, IconButton, Divider, Link,
} from "@mui/material";
import {
    LockOutlined, ArrowForward, Check, Visibility, VisibilityOff,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import api from "../../api/client";
import logo from "../../assets/sprintory-logo.png";

const MIN_PASSWORD_LENGTH = 8;

// Общая обёртка для обоих экранов: фон, логотип, карточка, круг с иконкой, заголовок, ссылка внизу
function AuthLayout({ icon, circleColor, title, children }) {
    return (
        <Box sx={{
            alignItems: "center",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100vh",
            px: 2,
            py: 4,
        }}>
            <Box component="img" src={logo} alt="Sprintory"
                 sx={{ height: 40, mb: 3, mixBlendMode: "multiply" }} />

            <Card sx={{ width: "100%", maxWidth: 520, p: 4, textAlign: "center" }}>
                <Box sx={{
                    width: 64, height: 64, borderRadius: "50%",
                    bgcolor: circleColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2,
                }}>
                    {icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {title}
                </Typography>

                {children}

                <Divider sx={{ mt: 3 }}>
                    <Link component={RouterLink} to="/login" underline="none">
                        Back to sign in
                    </Link>
                </Divider>
            </Card>
        </Box>
    );
}

// Поле пароля с иконкой замка и кнопкой «показать / скрыть»
function PasswordField({ label, placeholder, value, onChange, error, helperText }) {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <Typography align="left" sx={{ mb: 1, fontWeight: 700 }}>
                {label}
            </Typography>
            <TextField
                placeholder={placeholder}
                type={visible ? "text" : "password"}
                fullWidth
                required
                value={value}
                onChange={onChange}
                error={error}
                helperText={helperText}
                autoComplete="new-password"
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <LockOutlined />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    edge="end"
                                    aria-label={visible ? "Hide password" : "Show password"}
                                    onClick={() => setVisible((v) => !v)}
                                >
                                    {visible ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />
        </>
    );
}

function SetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // ссылка из письма: /set-password?token=...

    const [done, setDone] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const tooShort = password.length < MIN_PASSWORD_LENGTH;
    const mismatch = password !== confirm;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        setError("");
        if (tooShort || mismatch) return;

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, newPassword: password });
            setDone(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "The link is invalid or has expired. Please request a new one.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <AuthLayout
                title="Password reset successful"
                circleColor="success.main"
                icon={<Check fontSize="large" sx={{ color: "white" }} />}
            >
                <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                    Your password has been updated. You can now sign in to your account
                    and continue working on your projects.
                </Typography>
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate("/login")}
                >
                    Go to sign in
                </Button>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Set a new password"
            circleColor="ai.background"
            icon={<LockOutlined color="primary" fontSize="large" />}
        >
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Choose a new password for your account
            </Typography>

            {!token && (
                <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
                    The reset link is missing or invalid. Please request a new one.
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <PasswordField
                    label="New password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={touched && tooShort}
                    helperText={`Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`}
                />
                <Box sx={{ mt: 2 }}>
                    <PasswordField
                        label="Confirm new password"
                        placeholder="Confirm your new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        error={touched && !tooShort && mismatch}
                        helperText={touched && !tooShort && mismatch ? "Passwords do not match." : undefined}
                    />
                </Box>
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading || !token}
                    sx={{ mt: 3 }}
                    endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                >
                    Reset password
                </Button>
            </Box>
        </AuthLayout>
    );
}

export default SetPasswordPage;

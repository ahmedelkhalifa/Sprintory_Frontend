import {
    Box, Card, Typography, TextField, Button,
    InputAdornment, Divider, Link,
} from "@mui/material";
import {
    MailOutlined, ArrowForward, MarkEmailReadOutlined, InfoOutlined,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useState } from "react";

// Общая обёртка для обоих экранов: фон, карточка, круг с иконкой, заголовок, ссылка внизу
function AuthLayout({ icon, circleColor, title, children }) {
    return (
        <Box sx={{
            alignItems: "center",
            bgcolor: "background.default",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
            pb: 10,
        }}>
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

function ResetPage() {
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;
        // TODO: отправить запрос на бэкенд (api/), когда будет готов эндпоинт
        setSent(true);
    };

    if (sent) {
        return (
            <AuthLayout
                title="Check your email"
                circleColor="success.main"
                icon={<MarkEmailReadOutlined fontSize="large" sx={{ color: "white" }} />}
            >
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                    We've sent a password reset link to
                </Typography>
                <Typography sx={{ fontWeight: 700, mb: 3 }}>
                    {email}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    The link will expire in 30 minutes for your security.
                    If you don't see the email, please check your spam folder.
                </Typography>

                <Box sx={{
                    alignItems: "center",
                    bgcolor: "ai.background",
                    border: 1,
                    borderColor: "ai.border",
                    borderRadius: 2,
                    display: "flex",
                    gap: 1.5,
                    p: 2,
                    textAlign: "left",
                }}>
                    <InfoOutlined color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Didn't receive the email?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Check your spam folder or try again.
                        </Typography>
                    </Box>
                    <Button variant="text" onClick={() => { /* TODO: повторная отправка */ }}>
                        Resend link
                    </Button>
                </Box>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset your password"
            circleColor="ai.background"
            icon={<MailOutlined color="primary" fontSize="large" />}
        >
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Enter your email address and we'll send you a link to reset your password
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
                <Typography align="left" sx={{ mb: 1, fontWeight: 700 }}>
                    Email address
                </Typography>
                <TextField
                    placeholder="you@example.com"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <MailOutlined />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                    endIcon={<ArrowForward />}
                >
                    Send reset link
                </Button>
            </Box>
        </AuthLayout>
    );
}

export default ResetPage;
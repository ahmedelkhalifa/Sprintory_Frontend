import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    Button,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import notificationsApi from "../../api/notificationsApi";

const CATEGORY_LABELS = {
    ASSIGNMENT: "Task Assignments",
    MENTION: "Mentions",
    COMMENT: "Task Comments",
    STATUS_CHANGE: "Task Status Changes",
    PROJECT_MEMBERSHIP: "Project Invites & Roles",
    SPRINT: "Sprint Updates",
    INVITATION: "Workspace Invitations",
    SECURITY: "Security Alerts",
};

const DEFAULT_PREFERENCES = [
    { category: "ASSIGNMENT", inApp: true, email: true, locked: false, defaultInApp: true, defaultEmail: true },
    { category: "MENTION", inApp: true, email: true, locked: false, defaultInApp: true, defaultEmail: true },
    { category: "COMMENT", inApp: true, email: false, locked: false, defaultInApp: true, defaultEmail: false },
    { category: "STATUS_CHANGE", inApp: true, email: false, locked: false, defaultInApp: true, defaultEmail: false },
    { category: "PROJECT_MEMBERSHIP", inApp: true, email: false, locked: false, defaultInApp: true, defaultEmail: false },
    { category: "SPRINT", inApp: true, email: false, locked: false, defaultInApp: true, defaultEmail: false },
    { category: "INVITATION", inApp: true, email: true, locked: true, defaultInApp: true, defaultEmail: true },
    { category: "SECURITY", inApp: true, email: true, locked: true, defaultInApp: true, defaultEmail: true },
];

const NotificationPreferences = () => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        notificationsApi
            .getPreferences(controller.signal)
            .then((data) => {
                if (data?.preferences && data.preferences.length > 0) {
                    setPreferences(data.preferences);
                } else {
                    setPreferences(DEFAULT_PREFERENCES);
                }
                setLoading(false);
            })
            .catch((err) => {
                if (err.name !== "CanceledError") {
                    setPreferences(DEFAULT_PREFERENCES);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, []);

    const togglePreference = async (category, channel, currentValue) => {
        const payload = [{ category, [channel]: !currentValue }];
        try {
            const res = await notificationsApi.updatePreferences(payload);
            if (res?.preferences) setPreferences(res.preferences);
        } catch (err) {
            console.error("Failed to update preference", err);
        }
    };

    const handleReset = async () => {
        const unlocked = preferences.filter((p) => !p.locked);
        const updates = unlocked.map((p) => ({
            category: p.category,
            inApp: p.defaultInApp,
            email: p.defaultEmail,
        }));

        try {
            const res = await notificationsApi.updatePreferences(updates);
            if (res?.preferences) setPreferences(res.preferences);
        } catch (err) {
            console.error("Failed to reset preferences", err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Notification Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Choose how and when you want to receive notifications.
                    </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={handleReset} sx={{ textTransform: "none" }}>
                    Reset to defaults
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Notification Type</strong></TableCell>
                            <TableCell align="center"><strong>In-App</strong></TableCell>
                            <TableCell align="center"><strong>Email</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preferences.map((pref) => (
                            <TableRow key={pref.category}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {CATEGORY_LABELS[pref.category] || pref.category}
                                    </Typography>
                                    {pref.locked && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                            (Always on)
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title={pref.locked ? "This category cannot be turned off" : ""}>
                    <span>
                      <Switch
                          checked={pref.inApp}
                          disabled={pref.locked}
                          onChange={() => togglePreference(pref.category, "inApp", pref.inApp)}
                          color="primary"
                          size="small"
                      />
                    </span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title={pref.locked ? "This category cannot be turned off" : ""}>
                    <span>
                      <Switch
                          checked={pref.email}
                          disabled={pref.locked}
                          onChange={() => togglePreference(pref.category, "email", pref.email)}
                          color="primary"
                          size="small"
                      />
                    </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default NotificationPreferences;
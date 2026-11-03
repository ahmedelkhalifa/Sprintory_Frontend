import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Button, Tooltip, CircularProgress } from "@mui/material";
import notificationsApi from "../../api/notificationsApi";

const CATEGORY_LABELS = {
    ASSIGNMENT: "Task Assignments",
    MENTION: "Mentions",
    COMMENT: "Task Comments",
    STATUS_CHANGE: "Task Status Changes",
    PROJECT_MEMBERSHIP: "Project Invites & Roles",
    SPRINT: "Sprint Updates",
    INVITATION: "Workspace Invitations",
    SECURITY: "Security Alerts"
};

const NotificationPreferencesPage = () => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        notificationsApi.getPreferences(controller.signal)
            .then(data => {
                setPreferences(data.preferences);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== "CanceledError") setLoading(false);
            });

        return () => controller.abort();
    }, []);

    const togglePreference = async (category, channel, currentValue) => {
        const payload = [{ category, [channel]: !currentValue }];
        try {
            const res = await notificationsApi.updatePreferences(payload);
            setPreferences(res.preferences);
        } catch (err) {
            console.error("Failed to update preference", err);
        }
    };

    const handleReset = async () => {
        const unlocked = preferences.filter(p => !p.locked);
        const updates = unlocked.map(p => ({
            category: p.category,
            inApp: p.defaultInApp,
            email: p.defaultEmail
        }));

        try {
            const res = await notificationsApi.updatePreferences(updates);
            setPreferences(res.preferences);
        } catch (err) {
            console.error("Failed to reset preferences", err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Notification Preferences</Typography>
                <Button variant="outlined" onClick={handleReset} sx={{ textTransform: "none" }}>
                    Reset to defaults
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Notification Type</strong></TableCell>
                            <TableCell align="center"><strong>In-App</strong></TableCell>
                            <TableCell align="center"><strong>Email</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preferences.map(pref => (
                            <TableRow key={pref.category}>
                                <TableCell>
                                    {CATEGORY_LABELS[pref.category] || pref.category}
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

export default NotificationPreferencesPage;
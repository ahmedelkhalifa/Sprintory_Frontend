import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Button, Divider } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotificationStream } from "../../hooks/useNotificationStream";
import notificationsApi from "../../api/notificationsApi";

const NotificationBell = () => {
    const { unreadCount, latestNotification } = useNotificationStream();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [prevNotification, setPrevNotification] = useState(null);
    const navigate = useNavigate();

    const isOpen = Boolean(anchorEl);

    // Синхронизация нового уведомления из стрима прямо во время рендера (без useEffect)
    if (latestNotification && latestNotification !== prevNotification) {
        setPrevNotification(latestNotification);
        setNotifications((prev) => [
            latestNotification,
            ...prev.filter((n) => n.id !== latestNotification.id),
        ]);
    }

    useEffect(() => {
        if (isOpen) {
            const controller = new AbortController();
            notificationsApi
                .getNotifications({ page: 0, size: 20 }, controller.signal)
                .then((data) => setNotifications(data.content))
                .catch(() => {});
            return () => controller.abort();
        }
    }, [isOpen]);

    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);

    const handleOpenNotification = async (notification) => {
        try {
            const target = await notificationsApi.openNotification(notification.id);

            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
            );

            handleCloseMenu();

            if (target.kind === "TASK" && target.projectId && target.taskId) {
                navigate(`/projects/${target.projectId}/tasks/${target.taskKey}`);
            } else if (target.kind === "PROJECT" && target.projectId) {
                navigate(`/projects/${target.projectId}`);
            }
        } catch (err) {
            handleCloseMenu();
            if (err?.response?.status === 404) {
                navigate("/404");
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleOpenMenu}>
                <Badge badgeContent={unreadCount > 99 ? "99+" : unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleCloseMenu}
                slotProps={{
                    paper: {
                        sx: { width: 360, maxHeight: 440 },
                    },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Notifications
                    </Typography>
                    <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: "none" }}>
                        Mark all as read
                    </Button>
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <MenuItem disabled sx={{ py: 3, justifyContent: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            No notifications
                        </Typography>
                    </MenuItem>
                ) : (
                    notifications.map((n) => (
                        <MenuItem
                            key={n.id}
                            onClick={() => handleOpenNotification(n)}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                backgroundColor: n.read ? "transparent" : "action.hover",
                                borderBottom: 1,
                                borderColor: "divider",
                                whiteSpace: "normal",
                                py: 1.5,
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                                {n.message}
                            </Typography>
                            {n.excerpt && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>
                                    "{n.excerpt}"
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                                {new Date(n.createdAt).toLocaleString()}
                            </Typography>
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;
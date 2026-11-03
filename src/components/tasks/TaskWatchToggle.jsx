import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import notificationsApi from "../../api/notificationsApi.js";

const TaskWatchToggle = ({ projectId, taskId }) => {
    const [isWatching, setIsWatching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        notificationsApi.getWatchStatus(projectId, taskId, controller.signal)
            .then(res => setIsWatching(res.watching))
            .catch(() => {})
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [projectId, taskId]);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const res = await notificationsApi.setWatchStatus(projectId, taskId, !isWatching);
            setIsWatching(res.watching);
        } catch (err) {
            console.error("Failed to toggle watch status", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={isWatching ? "contained" : "outlined"}
            color={isWatching ? "primary" : "inherit"}
            onClick={handleToggle}
            disabled={isLoading}
            startIcon={isWatching ? <VisibilityIcon /> : <VisibilityOffIcon />}
            size="small"
            sx={{ textTransform: "none" }}
        >
            {isWatching ? "Watching" : "Watch"}
        </Button>
    );
};

export default TaskWatchToggle;
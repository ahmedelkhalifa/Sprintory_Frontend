import { useEffect, useState } from "react";
import { Avatar, Box, Button, CircularProgress, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import UserAvatar from "../general/UserAvatar";
import { getTaskHistory } from "../../api/historyApi";
import { formatDate, timeAgo } from "../../utils/format";
import { memberLabel } from "../../utils/people";

const formatHistoryLine = (item) => {
    const actorName = item.actor ? memberLabel(item.actor) : "Someone";
    const actor = <strong>{actorName}</strong>;

    if (item.type === "CREATED") return <>{actor} created the task</>;
    if (item.type === "COMMENT_DELETED") return <>{actor} deleted a comment</>;
    if (item.type === "RESTORED") return <>{actor} restored the task</>;
    if (item.type === "SUBTASK_ADDED") return <>{actor} added subtask {item.newValue}</>;
    if (item.type === "SUBTASK_REMOVED") return <>{actor} removed subtask {item.oldValue}</>;

    if (item.type === "FIELD_CHANGED") {
        switch (item.field) {
            case "TITLE":
                return <>{actor} changed the title: <em>{item.oldValue}</em> → <em>{item.newValue}</em></>;
            case "TYPE":
                return <>{actor} changed the type: {item.oldValue} → {item.newValue}</>;
            case "PRIORITY":
                return <>{actor} changed the priority: {item.oldValue} → {item.newValue}</>;
            case "STATUS":
                return <>{actor} moved it: {item.oldValue} → {item.newValue}</>;
            case "ASSIGNEE":
                if (!item.oldValue) return <>{actor} assigned it to {item.newValue}</>;
                if (!item.newValue) return <>{actor} unassigned {item.oldValue}</>;
                return <>{actor} changed the assignee: {item.oldValue} → {item.newValue}</>;
            case "ESTIMATE":
                return <>{actor} changed the estimate: {item.oldValue || "None"} → {item.newValue || "None"}</>;
            case "LABELS":
                return <>{actor} changed the labels: {item.oldValue || "None"} → {item.newValue || "None"}</>;
            case "DESCRIPTION":
                return <>{actor} changed the description</>;
            default:
                return <>{actor} changed the task</>;
        }
    }

    return <>{actor} changed the task</>;
};

const TaskHistory = ({ project, taskId }) => {
    const [history, setHistory] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        getTaskHistory(project.id, taskId, 0, 20, controller.signal)
            .then((data) => {
                setHistory(data.content);
                setHasMore(data.page + 1 < data.totalPages);
                setPage(0);
                setError(null);
            })
            .catch((err) => {
                if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
                    setError("Couldn't load history. Please try again.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [project.id, taskId]);

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const data = await getTaskHistory(project.id, taskId, nextPage, 20);
            setHistory((prev) => [...prev, ...data.content]);
            setHasMore(data.page + 1 < data.totalPages);
            setPage(nextPage);
        } catch {
            // Игнорируем или обрабатываем ошибку дозагрузки
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error && history.length === 0) {
        return (
            <Typography variant="body2" color="error">
                {error}
            </Typography>
        );
    }

    if (history.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                No history records yet.
            </Typography>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                {history.map((entry) => (
                    <Box component="li" key={entry.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        {entry.actor ? (
                            <UserAvatar user={entry.actor} size={30} />
                        ) : (
                            <Avatar sx={{ width: 30, height: 30, bgcolor: "action.selected", color: "text.secondary" }}>
                                <PersonOutlineIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2">
                                {formatHistoryLine(entry)}
                                {" "}
                                <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                    title={`${formatDate(entry.occurredAt)} ${new Date(entry.occurredAt).toLocaleTimeString()}`}
                                >
                                    · {timeAgo(entry.occurredAt)}
                                </Typography>
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {hasMore && (
                <Button
                    size="small"
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    sx={{ alignSelf: "flex-start", textTransform: "none", mt: 1 }}
                >
                    {loadingMore ? "Loading..." : "Load more"}
                </Button>
            )}
        </Box>
    );
};

export default TaskHistory;
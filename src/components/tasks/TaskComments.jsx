import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogActions,
    Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getComments, createComment, updateComment, deleteComment } from "../../api/commentsApi";
import RichTextEditor from "../editor/RichTextEditor";
import RichTextReadOnly from "../editor/RichTextReadOnly";
import UserAvatar from "../general/UserAvatar";
import { timeAgo } from "../../utils/format";

const TaskComments = ({ projectId, taskId, permissions = [] }) => {
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [newCommentBody, setNewCommentBody] = useState("");
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editBody, setEditBody] = useState("");
    const [editError, setEditError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const canComment = permissions.includes("COMMENT");

    useEffect(() => {
        const controller = new AbortController();

        getComments(projectId, taskId, 0, 20, controller.signal)
            .then((data) => {
                setComments(data.content);
                setHasMore(data.page + 1 < data.totalPages);
                setPage(0);
            })
            .catch((err) => {
                if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
                    console.error("Failed to fetch comments", err);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [projectId, taskId]);

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const data = await getComments(projectId, taskId, nextPage, 20);
            setComments((prev) => [...prev, ...data.content]);
            setHasMore(data.page + 1 < data.totalPages);
            setPage(nextPage);
        } catch (err) {
            console.error("Failed to fetch more comments", err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handlePost = async () => {
        if (!newCommentBody) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const created = await createComment(projectId, taskId, newCommentBody);
            setComments((prev) => [...prev, created]);
            setNewCommentBody("");
        } catch (err) {
            const data = err?.response?.data;
            if (data?.code === "INVALID_RICH_TEXT" || data?.code === "INVALID_MENTION" || data?.code === "ACCESS_DENIED") {
                setSubmitError(data.message);
            } else {
                setSubmitError("Failed to post comment. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveEdit = async (commentId) => {
        setEditError(null);
        try {
            const updated = await updateComment(projectId, taskId, commentId, editBody);
            setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
            setEditingId(null);
        } catch (err) {
            const data = err?.response?.data;
            if (data?.code === "INVALID_RICH_TEXT" || data?.code === "INVALID_MENTION") {
                setEditError(data.message);
            } else {
                setEditError("Failed to edit comment.");
            }
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteComment(projectId, taskId, deleteId);
            setComments((prev) =>
                prev.map((c) => (c.id === deleteId ? { ...c, deleted: true, body: null } : c))
            );
        } catch (err) {
            console.error("Failed to delete comment", err);
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Comments
            </Typography>

            {loading ? (
                <CircularProgress size={24} sx={{ display: "block", my: 2 }} />
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                    {comments.map((c) => (
                        <Paper key={c.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            {c.deleted ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                    Comment deleted
                                </Typography>
                            ) : editingId === c.id ? (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    <RichTextEditor
                                        content={c.body}
                                        onChange={setEditBody}
                                        projectId={projectId}
                                    />
                                    {editError && (
                                        <Alert severity="error" sx={{ py: 0, px: 1 }}>
                                            {editError}
                                        </Alert>
                                    )}
                                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
                                        <Button size="small" onClick={() => { setEditingId(null); setEditError(null); }}>Cancel</Button>
                                        <Button size="small" variant="contained" onClick={() => handleSaveEdit(c.id)}>Save</Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <UserAvatar user={c.author} size={24} />
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {c.author?.name || "Deleted user"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                · {timeAgo(c.createdAt)} {c.editedAt && "(edited)"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 0.5 }}>
                                            {c.canEdit && (
                                                <IconButton size="small" onClick={() => { setEditingId(c.id); setEditBody(c.body); setEditError(null); }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            {c.canDelete && (
                                                <IconButton size="small" color="error" onClick={() => setDeleteId(c.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                    <RichTextReadOnly content={c.body} mentions={c.mentions} />
                                </Box>
                            )}
                        </Paper>
                    ))}

                    {hasMore && (
                        <Button
                            size="small"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            sx={{ textTransform: "none", alignSelf: "flex-start" }}
                        >
                            {loadingMore ? "Loading..." : "Load more"}
                        </Button>
                    )}
                </Box>
            )}

            {canComment && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Add a comment</Typography>
                    <RichTextEditor
                        content={newCommentBody}
                        onChange={(val) => {
                            setNewCommentBody(val);
                            if (submitError) setSubmitError(null);
                        }}
                        projectId={projectId}
                        placeholder="Write a comment... Use @ to mention"
                    />
                    {submitError && (
                        <Typography variant="caption" color="error">
                            {submitError}
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        onClick={handlePost}
                        disabled={submitting || !newCommentBody}
                        sx={{ alignSelf: "flex-end", textTransform: "none" }}
                    >
                        Comment
                    </Button>
                </Box>
            )}

            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
                <DialogTitle>Delete comment?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TaskComments;
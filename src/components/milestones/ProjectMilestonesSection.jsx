import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    IconButton,
    LinearProgress,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ToneChip from "../general/ToneChip";
import LoadState from "../general/LoadState";
import ConfirmDialog from "../general/ConfirmDialog";
import MilestoneDialog from "./MilestoneDialog";
import { deleteMilestone, listMilestones, restoreMilestone } from "../../api/milestonesApi";
import { useAsync } from "../../hooks/useAsync";
import { useLatched } from "../../hooks/useLatched";
import { useSubmit } from "../../hooks/useSubmit";
import { MILESTONE_ERROR_MESSAGES, MILESTONE_STATUS } from "../../constants/tasks";
import { milestonePath } from "../../utils/project";
import { deleteMilestoneText, progressLabel } from "../../utils/milestone";
import { errorMessage } from "../../utils/apiError";
import { formatDate } from "../../utils/format";
import { revealChildren } from "../../theme/motion";

const isConflictOrArchived = (err) => {
    const status = err?.response?.status;
    const code = err?.response?.data?.code;
    return status === 409 || code === "WORKSPACE_ARCHIVED";
};

const MilestoneRow = ({ workspace, project, milestone, canManage, onEdit, onDelete }) => {
    const [anchor, setAnchor] = useState(null);
    const st = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.UPCOMING;
    const isEmpty = milestone.status === "EMPTY";

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                p: 2,
                borderBottom: 1,
                borderColor: "divider",
                "&:last-child": { borderBottom: 0 },
                "&:hover": { bgcolor: "action.hover" },
            }}
        >
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography
                        component={RouterLink}
                        to={milestonePath(workspace, project, milestone.id)}
                        variant="body1"
                        sx={{ fontWeight: 600, color: "text.primary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                    >
                        {milestone.name}
                    </Typography>
                    <ToneChip label={st.label} tone={st.tone} dot />
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(milestone.targetDate)}
                    </Typography>
                </Box>

                {isEmpty ? (
                    <Typography variant="body2" color="text.secondary">
                        No tasks yet
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, maxWidth: 420 }}>
                        <LinearProgress
                            variant="determinate"
                            value={milestone.progress?.percent ?? 0}
                            color={milestone.status === "REACHED" ? "success" : milestone.status === "OVERDUE" ? "error" : "primary"}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                            {progressLabel(milestone.progress)}
                        </Typography>
                    </Box>
                )}
            </Box>

            {canManage && (
                <>
                    <IconButton size="small" aria-label={`Actions for ${milestone.name}`} onClick={(e) => setAnchor(e.currentTarget)}>
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={anchor}
                        open={Boolean(anchor)}
                        onClose={() => setAnchor(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                        <MenuItem
                            onClick={() => {
                                setAnchor(null);
                                onEdit(milestone);
                            }}
                        >
                            Edit
                        </MenuItem>
                        <MenuItem
                            sx={{ color: "error.main" }}
                            onClick={() => {
                                setAnchor(null);
                                onDelete(milestone);
                            }}
                        >
                            Delete
                        </MenuItem>
                    </Menu>
                </>
            )}
        </Box>
    );
};

const ProjectMilestonesSection = ({ workspace, project, writable }) => {
    const state = useAsync((signal) => listMilestones(project.id, signal), [project.id], {
        fallback: "Couldn't load milestones. Please try again.",
        messages: MILESTONE_ERROR_MESSAGES,
    });

    const [dialog, setDialog] = useState(null); // { type: "create" | "edit" | "delete", milestone? }
    const shownDialog = useLatched(dialog);
    const [toast, setToast] = useState(null); // { id, name, status: "deleted" | "restored" | "error", message? }
    const removeSubmit = useSubmit(MILESTONE_ERROR_MESSAGES);
    const restoreSubmit = useSubmit(MILESTONE_ERROR_MESSAGES);

    const data = state.data;
    const milestones = data?.milestones ?? [];
    const limit = data?.limit ?? 50;
    const canManage = writable && Boolean(data?.canManage);
    const limitReached = milestones.length >= limit;

    const afterSaved = () => {
        setDialog(null);
        state.reload();
    };

    const handleDelete = async () => {
        const target = dialog.milestone;
        const { ok, error } = await removeSubmit.run(() => deleteMilestone(target.id));
        if (ok) {
            setDialog(null);
            state.reload();
            setToast({ id: target.id, name: target.name, status: "deleted" });
        } else if (isConflictOrArchived(error)) {
            state.reload();
        }
    };

    const handleUndo = async () => {
        if (!toast || toast.status !== "deleted") return;
        const { ok, error } = await restoreSubmit.run(() => restoreMilestone(toast.id));
        if (ok) {
            setToast({ id: toast.id, name: toast.name, status: "restored" });
            state.reload();
        } else {
            setToast({
                id: toast.id,
                name: toast.name,
                status: "error",
                message: errorMessage(error, "Couldn't restore milestone.", MILESTONE_ERROR_MESSAGES),
            });
            if (isConflictOrArchived(error)) state.reload();
        }
    };

    return (
        <>
            <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: 3,
                        py: 2,
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FlagOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="h6">Milestones</Typography>
                        <ToneChip label={milestones.length} />
                    </Box>

                    {canManage && (
                        <Tooltip title={limitReached ? `Maximum ${limit} milestones per project reached` : ""}>
              <span>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={limitReached}
                    onClick={() => setDialog({ type: "create" })}
                >
                  Add milestone
                </Button>
              </span>
                        </Tooltip>
                    )}
                </Box>

                {!data ? (
                    <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={3} />
                ) : milestones.length === 0 ? (
                    <Box sx={{ py: 4.5, px: 3, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            No milestones yet.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Define key dates and link tasks to track progress toward releases or demos.
                        </Typography>
                    </Box>
                ) : (
                    <Stack sx={revealChildren(1)}>
                        {milestones.map((m) => (
                            <MilestoneRow
                                key={m.id}
                                workspace={workspace}
                                project={project}
                                milestone={m}
                                canManage={canManage}
                                onEdit={(target) => setDialog({ type: "edit", milestone: target })}
                                onDelete={(target) => setDialog({ type: "delete", milestone: target })}
                            />
                        ))}
                    </Stack>
                )}
            </Paper>

            {(shownDialog?.type === "create" || shownDialog?.type === "edit") && (
                <MilestoneDialog
                    open={dialog?.type === "create" || dialog?.type === "edit"}
                    projectId={project.id}
                    milestone={shownDialog.milestone}
                    onClose={() => setDialog(null)}
                    onSaved={afterSaved}
                />
            )}

            {shownDialog?.type === "delete" && (
                <ConfirmDialog
                    open={dialog?.type === "delete"}
                    title={`Delete "${shownDialog.milestone.name}"?`}
                    message={deleteMilestoneText(shownDialog.milestone)}
                    confirmLabel="Delete"
                    tone="danger"
                    loading={removeSubmit.submitting}
                    error={removeSubmit.error}
                    onConfirm={handleDelete}
                    onClose={() => {
                        setDialog(null);
                        removeSubmit.clearError();
                    }}
                />
            )}

            <Snackbar
                open={Boolean(toast)}
                autoHideDuration={6000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={toast?.status === "error" ? "error" : "info"}
                    variant="filled"
                    onClose={() => setToast(null)}
                    action={
                        toast?.status === "deleted" ? (
                            <Button color="inherit" size="small" disabled={restoreSubmit.submitting} onClick={handleUndo}>
                                Undo
                            </Button>
                        ) : null
                    }
                >
                    {toast?.status === "error"
                        ? toast.message
                        : toast?.status === "restored"
                            ? `Milestone "${toast.name}" restored (former tasks remain unlinked).`
                            : "Milestone deleted."}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ProjectMilestonesSection;
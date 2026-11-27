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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ToneChip from "../general/ToneChip";
import LoadState from "../general/LoadState";
import ConfirmDialog from "../general/ConfirmDialog";
import MilestoneDialog from "./MilestoneDialog";
import { deleteMilestone, listMilestones, restoreMilestone, USE_MOCK } from "../../api/milestonesApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { MILESTONE_ERROR_MESSAGES, MILESTONE_STATUS } from "../../constants/tasks";
import { milestonePath } from "../../utils/project";
import { formatDate } from "../../utils/format";

const progressLabel = (progress) => {
    if (!progress) return "";
    const tasksPart = `${progress.doneTasks} / ${progress.totalTasks} tasks`;
    return progress.basis === "POINTS"
        ? `${progress.donePoints} / ${progress.totalPoints} pts (${tasksPart})`
        : tasksPart;
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
                        sx={{ fontWeight: 600, fontSize: 15, color: "text.primary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
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
    const state = useAsync((signal) => listMilestones(project.id, signal, { columns: project.columns }), [project.id, project.columns],  {
        fallback: "Couldn't load milestones. Please try again.",
        messages: MILESTONE_ERROR_MESSAGES,
    });

    const [dialog, setDialog] = useState(null); // { type: "create" | "edit" | "delete", milestone? }
    const [deletedToast, setDeletedToast] = useState(null); // { id, name, restored? }
    const removeSubmit = useSubmit(MILESTONE_ERROR_MESSAGES);
    const restoreSubmit = useSubmit(MILESTONE_ERROR_MESSAGES);

    const data = state.data;
    const milestones = data?.milestones ?? [];
    const limit = data?.limit ?? 50;
    const canManage = writable && (USE_MOCK || Boolean(data?.canManage));
    const limitReached = milestones.length >= limit;

    const afterSaved = () => {
        setDialog(null);
        state.reload();
    };

    const handleDelete = async () => {
        const target = dialog.milestone;
        const { ok } = await removeSubmit.run(() => deleteMilestone(target.id));
        if (ok) {
            setDialog(null);
            state.reload();
            setDeletedToast({ id: target.id, name: target.name, restored: false });
        }
    };

    const handleUndo = async () => {
        if (!deletedToast) return;
        const { ok } = await restoreSubmit.run(() => restoreMilestone(deletedToast.id));
        if (ok) {
            setDeletedToast({ id: deletedToast.id, name: deletedToast.name, restored: true });
            state.reload();
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, fontSize: 16 }}>
                            Milestones
                        </Typography>
                        <ToneChip label={milestones.length} />
                    </Box>

                    {canManage && (
                        <Tooltip title={limitReached ? `Maximum ${limit} milestones per project reached` : ""}>
              <span>
                <Button
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
                    <Stack>
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

            {(dialog?.type === "create" || dialog?.type === "edit") && (
                <MilestoneDialog
                    projectId={project.id}
                    milestone={dialog.milestone}
                    onClose={() => setDialog(null)}
                    onSaved={afterSaved}
                />
            )}

            {dialog?.type === "delete" && (
                <ConfirmDialog
                    title={`Delete "${dialog.milestone.name}"?`}
                    message={
                        (dialog.milestone.progress?.totalTasks ?? 0) > 0
                            ? `${dialog.milestone.progress.totalTasks} ${dialog.milestone.progress.totalTasks === 1 ? "task" : "tasks"} will be unlinked.`
                            : "It has no tasks."
                    }
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
                open={Boolean(deletedToast)}
                autoHideDuration={6000}
                onClose={() => setDeletedToast(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity="info"
                    variant="filled"
                    onClose={() => setDeletedToast(null)}
                    action={
                        deletedToast && !deletedToast.restored ? (
                            <Button color="inherit" size="small" disabled={restoreSubmit.submitting} onClick={handleUndo}>
                                Undo
                            </Button>
                        ) : null
                    }
                >
                    {deletedToast?.restored
                        ? `Milestone "${deletedToast.name}" restored (former tasks remain unlinked).`
                        : "Milestone deleted."}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ProjectMilestonesSection;
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ToneChip from "../general/ToneChip";
import LoadState from "../general/LoadState";
import ConfirmDialog from "../general/ConfirmDialog";
import TaskFilterBar from "../tasks/filters/TaskFilterBar";
import MilestoneDialog from "./MilestoneDialog";
import LinkTasksDialog from "./LinkTasksDialog";
import { deleteMilestone, getMilestone, setTaskMilestone } from "../../api/milestonesApi";
import { getBoard, listProjectMembers } from "../../api/projectsApi";
import { listTasks } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useLatched } from "../../hooks/useLatched";
import { useSubmit } from "../../hooks/useSubmit";
import { MILESTONE_ERROR_MESSAGES, MILESTONE_STATUS, TASK_TYPES } from "../../constants/tasks";
import { EMPTY_TASK_FILTERS, taskFilterParams } from "../../utils/taskFilters";
import { progressLabel } from "../../utils/milestone";
import { projectLabels, taskPath } from "../../utils/task";
import { formatDate } from "../../utils/format";
import { reveal, revealChildren } from "../../theme/motion";

const MEMBERS_SIZE = 100;
const TASKS_PAGE_SIZE = 100;

const isConflictOrArchived = (err) => {
    const status = err?.response?.status;
    const code = err?.response?.data?.code;
    return status === 409 || code === "WORKSPACE_ARCHIVED";
};

// Loads all pages when a milestone has more than 100 linked tasks
const loadAllLinkedTasks = async (projectId, baseParams, signal) => {
    const first = await listTasks(projectId, { ...baseParams, page: 0, size: TASKS_PAGE_SIZE }, signal);
    const items = [...(first.content ?? [])];
    const totalPages = first.totalPages ?? 1;
    for (let page = 1; page < totalPages; page += 1) {
        const next = await listTasks(projectId, { ...baseParams, page, size: TASKS_PAGE_SIZE }, signal);
        items.push(...(next.content ?? []));
    }
    return items;
};

const MilestonePage = ({ workspace, project, milestoneId, writable, onBack }) => {
    const [filters, setFilters] = useState(EMPTY_TASK_FILTERS);
    const [dialog, setDialog] = useState(null); // "edit" | "delete" | "link"
    const shownDialog = useLatched(dialog);
    const removeSubmit = useSubmit(MILESTONE_ERROR_MESSAGES);
    const unlinkSubmit = useSubmit(MILESTONE_ERROR_MESSAGES);

    const metaState = useAsync(
        async (signal) => {
            const [board, members] = await Promise.all([
                getBoard(project.id, signal),
                listProjectMembers(project.id, { size: MEMBERS_SIZE }, signal),
            ]);
            return { columns: board.columns ?? [], members: members.content ?? [] };
        },
        [project.id],
        { fallback: "Couldn't load board columns." },
    );

    const milestoneState = useAsync(
        (signal) => getMilestone(milestoneId, signal),
        [milestoneId],
        { fallback: "Couldn't load milestone.", messages: MILESTONE_ERROR_MESSAGES },
    );

    const tasksState = useAsync(
        (signal) =>
            loadAllLinkedTasks(
                project.id,
                { ...taskFilterParams(filters), milestoneId: Number(milestoneId), order: "board" },
                signal,
            ),
        [project.id, milestoneId, filters],
        { fallback: "Couldn't load linked tasks." },
    );

    const reloadAll = () => {
        milestoneState.reload();
        tasksState.reload();
    };

    if (milestoneState.error) {
        if (milestoneState.errorCode === "RESOURCE_NOT_FOUND") {
            return (
                <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Milestone not found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        This milestone may have been deleted or you don't have access to it.
                    </Typography>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
                        Back to Overview
                    </Button>
                </Paper>
            );
        }

        return (
            <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                <LoadState error={milestoneState.error} onRetry={milestoneState.reload} />
            </Paper>
        );
    }

    const milestone = milestoneState.data;
    if (!milestone) {
        return (
            <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                <LoadState loading rows={5} />
            </Paper>
        );
    }

    const columns = metaState.data?.columns ?? [];
    const members = metaState.data?.members ?? [];
    const canManage = writable && Boolean(milestone.canManage);
    const canLink = writable && Boolean(milestone.canLink);
    const st = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.UPCOMING;
    const tasks = tasksState.data ?? [];

    const handleDelete = async () => {
        const { ok, error } = await removeSubmit.run(() => deleteMilestone(milestone.id));
        if (ok) {
            onBack();
        } else if (isConflictOrArchived(error)) {
            reloadAll();
        }
    };

    const handleUnlink = async (taskId) => {
        const { ok, error } = await unlinkSubmit.run(() => setTaskMilestone(taskId, null));
        if (ok || isConflictOrArchived(error)) {
            reloadAll();
        }
    };

    // Group linked tasks by board column order
    const groupedByColumn = columns
        .map((col) => ({
            column: col,
            items: tasks.filter((t) => t.statusId === col.id),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Stack spacing={3}>
            <Box sx={reveal(1)}>
                <Button size="small" color="inherit" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 1 }}>
                    Overview
                </Button>

                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mb: 1 }}>
                                <Typography variant="h4">{milestone.name}</Typography>
                                <ToneChip label={st.label} tone={st.tone} dot />
                                <Typography variant="body2" color="text.secondary">
                                    Target date: {formatDate(milestone.targetDate)}
                                </Typography>
                            </Box>

                            {milestone.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                                    {milestone.description}
                                </Typography>
                            )}

                            {milestone.status === "EMPTY" ? (
                                <Typography variant="body2" color="text.secondary">
                                    No tasks yet
                                </Typography>
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 480 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={milestone.progress?.percent ?? 0}
                                        color={milestone.status === "REACHED" ? "success" : milestone.status === "OVERDUE" ? "error" : "primary"}
                                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                                        {progressLabel(milestone.progress)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            {canLink && (
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog("link")}>
                                    Add tasks
                                </Button>
                            )}
                            {canManage && (
                                <>
                                    <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setDialog("edit")}>
                                        Edit
                                    </Button>
                                    <Button variant="outlined" color="error" startIcon={<DeleteOutlinedIcon />} onClick={() => setDialog("delete")}>
                                        Delete
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Box sx={reveal(2)}>
                <TaskFilterBar
                    filters={filters}
                    onChange={setFilters}
                    members={members}
                    columns={columns}
                    hideMilestone
                    labels={projectLabels(tasks)}
                    match={{ loading: tasksState.loading, error: tasksState.error, matches: null, reload: tasksState.reload }}
                    shown={tasks.length}
                    total={tasks.length}
                />

                {!metaState.data ? (
                    <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                        <LoadState loading={!metaState.error} error={metaState.error} onRetry={metaState.reload} rows={4} />
                    </Paper>
                ) : !tasksState.data ? (
                    <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                        <LoadState loading={!tasksState.error} error={tasksState.error} onRetry={tasksState.reload} rows={4} />
                    </Paper>
                ) : tasks.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No linked tasks match the current view.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2} sx={revealChildren(1)}>
                        {groupedByColumn.map(({ column, items }) => (
                            <Paper key={column.id} elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                                <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="h6">{column.name}</Typography>
                                    <ToneChip label={items.length} />
                                </Box>
                                <Stack>
                                    {items.map((task) => {
                                        const TypeIcon = (TASK_TYPES[task.type] ?? TASK_TYPES.TASK).Icon;
                                        return (
                                            <Box
                                                key={task.id}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    px: 2,
                                                    py: 1.25,
                                                    borderBottom: 1,
                                                    borderColor: "divider",
                                                    "&:last-child": { borderBottom: 0 },
                                                }}
                                            >
                                                <TypeIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {task.key}
                                                </Typography>
                                                <Typography
                                                    component={RouterLink}
                                                    to={taskPath(workspace, project, task.id)}
                                                    variant="body2"
                                                    sx={{ flex: 1, fontWeight: 500, color: "text.primary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                                                >
                                                    {task.title}
                                                </Typography>
                                                {task.estimate != null && <ToneChip label={`${task.estimate} pts`} />}
                                                {canLink && (
                                                    <Tooltip title="Unlink from milestone">
                                                        <IconButton
                                                            size="small"
                                                            disabled={unlinkSubmit.submitting}
                                                            onClick={() => handleUnlink(task.id)}
                                                            aria-label="Unlink task"
                                                        >
                                                            <LinkOffIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>

            {(shownDialog === "edit" || shownDialog === "link") && (
                <>
                    {shownDialog === "edit" && (
                        <MilestoneDialog
                            open={dialog === "edit"}
                            projectId={project.id}
                            milestone={milestone}
                            onClose={() => setDialog(null)}
                            onSaved={() => {
                                setDialog(null);
                                reloadAll();
                            }}
                        />
                    )}
                    {shownDialog === "link" && (
                        <LinkTasksDialog
                            open={dialog === "link"}
                            projectId={project.id}
                            milestone={milestone}
                            onClose={() => setDialog(null)}
                            onLinked={() => {
                                setDialog(null);
                                reloadAll();
                            }}
                        />
                    )}
                </>
            )}

            {shownDialog === "delete" && (
                <ConfirmDialog
                    open={dialog === "delete"}
                    title={`Delete "${milestone.name}"?`}
                    message={
                        (milestone.progress?.totalTasks ?? 0) > 0
                            ? `${milestone.progress.totalTasks} ${milestone.progress.totalTasks === 1 ? "task" : "tasks"} will be unlinked.`
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
        </Stack>
    );
};

export default MilestonePage;
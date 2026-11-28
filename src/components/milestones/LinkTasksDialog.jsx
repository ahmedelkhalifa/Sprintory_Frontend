import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";
import SearchField from "../general/SearchField";
import LoadState from "../general/LoadState";
import { listTasks } from "../../api/tasksApi";
import { linkTasksToMilestone } from "../../api/milestonesApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { MILESTONE_ERROR_MESSAGES, TASK_TYPES } from "../../constants/tasks";

const LinkTasksDialog = ({ open = true, projectId, milestone, onClose, onLinked }) => {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(new Set());
    const submit = useSubmit(MILESTONE_ERROR_MESSAGES);

    const tasksState = useAsync(
        (signal) => listTasks(projectId, { q: search.trim() || undefined, order: "board", size: 50 }, signal),
        [projectId, search],
        { fallback: "Couldn't load tasks." },
    );

    const tasks = (tasksState.data?.content ?? []).filter((t) => t.parentTaskId == null);

    const toggle = (taskId) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const handleSave = async () => {
        if (selected.size === 0) return;
        const { ok, result } = await submit.run(() => linkTasksToMilestone(milestone.id, [...selected]));
        if (ok) onLinked(result);
    };

    return (
        <Dialog open={open} onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>Add tasks to {milestone.name}</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <SearchField value={search} onChange={setSearch} placeholder="Search tasks by title or key…" />
                </Box>

                {!tasksState.data ? (
                    <LoadState loading={!tasksState.error} error={tasksState.error} onRetry={tasksState.reload} rows={4} />
                ) : tasks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                        No matching top-level tasks found.
                    </Typography>
                ) : (
                    <List dense disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
                        {tasks.map((task) => {
                            const alreadyHere = Number(task.milestone?.id) === Number(milestone.id);
                            const otherMilestone = !alreadyHere && task.milestone ? task.milestone.name : null;
                            const checked = alreadyHere || selected.has(task.id);
                            const TypeIcon = (TASK_TYPES[task.type] ?? TASK_TYPES.TASK).Icon;

                            return (
                                <ListItemButton
                                    key={task.id}
                                    disabled={alreadyHere}
                                    onClick={() => toggle(task.id)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Checkbox edge="start" checked={checked} disabled={alreadyHere} tabIndex={-1} disableRipple />
                                    </ListItemIcon>
                                    <TypeIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                    <ListItemText
                                        primary={`${task.key} · ${task.title}`}
                                        secondary={
                                            alreadyHere
                                                ? "Already linked to this milestone"
                                                : otherMilestone
                                                    ? `Currently in "${otherMilestone}" — will be moved here`
                                                    : null
                                        }
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}

                {submit.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {submit.error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={submit.submitting} color="inherit">
                    Cancel
                </Button>
                <Button variant="contained" disabled={selected.size === 0} loading={submit.submitting} onClick={handleSave}>
                    Add {selected.size > 0 ? `(${selected.size})` : ""}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LinkTasksDialog;
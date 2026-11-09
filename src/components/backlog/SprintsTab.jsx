import { useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SprintHeader from "../backlog/SprintHeader";
import SprintDialog from "../backlog/SprintDialog";
import StartSprintDialog from "../backlog/StartSprintDialog";
import ConfirmDialog from "../general/ConfirmDialog";
import LoadState from "../general/LoadState";
import NoWorkAccess from "../tasks/NoWorkAccess";
import { deleteSprint, listSprints } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { PERMISSIONS } from "../../constants/projects";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { can } from "../../utils/project";

const SprintsTab = ({ project, writable }) => {
    const canView = can(project, PERMISSIONS.VIEW_WORK);
    const canPlan = writable && can(project, PERMISSIONS.MANAGE_SPRINTS);

    const sprintsState = useAsync((signal) => listSprints(project.id, signal), [project.id], {
        enabled: canView,
        fallback: "Couldn't load sprints. Please try again.",
        messages: TASK_ERROR_MESSAGES,
    });

    const [dialog, setDialog] = useState(null);
    const removeSprint = useSubmit(TASK_ERROR_MESSAGES);

    if (!canView) return <NoWorkAccess />;

    if (!sprintsState.data) {
        return (
            <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                <LoadState loading={!sprintsState.error} error={sprintsState.error} onRetry={sprintsState.reload} rows={4} />
            </Paper>
        );
    }

    const sprints = Array.isArray(sprintsState.data) ? sprintsState.data : (sprintsState.data?.content || []);
    const activeSprint = sprints.find((s) => s?.status === "ACTIVE");

    const closeDialog = () => setDialog(null);
    const afterChange = () => {
        closeDialog();
        sprintsState.reload();
    };

    const handleDeleteSprint = async () => {
        const { ok } = await removeSprint.run(() => deleteSprint(dialog.sprint.id));
        if (ok) afterChange();
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Sprint Planning
                </Typography>
                {canPlan && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: "create-sprint" })}>
                        Create sprint
                    </Button>
                )}
            </Box>

            {sprints.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: "center",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.paper",
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        No sprints created yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        {canPlan
                            ? "Create your first sprint to set dates, goals, and capacity."
                            : "No sprints have been created for this project yet."}
                    </Typography>
                    {canPlan && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: "create-sprint" })}>
                            Create first sprint
                        </Button>
                    )}
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {sprints.map((rawSprint) => {
                        const sprint = {
                            ...rawSprint,
                            tasks: Array.isArray(rawSprint?.tasks) ? rawSprint.tasks : [],
                            status: rawSprint?.status || "PLANNED",
                        };

                        return (
                            <Paper key={sprint.id} elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                                <SprintHeader
                                    sprint={sprint}
                                    canPlan={canPlan}
                                    startBlocked={Boolean(activeSprint && activeSprint.id !== sprint.id)}
                                    onStart={() => setDialog({ type: "start-sprint", sprint })}
                                    onEdit={() => setDialog({ type: "edit-sprint", sprint })}
                                    onDelete={() => setDialog({ type: "delete-sprint", sprint })}
                                />
                            </Paper>
                        );
                    })}
                </Stack>
            )}

            {(dialog?.type === "create-sprint" || dialog?.type === "edit-sprint") && (
                <SprintDialog projectId={project.id} sprint={dialog.sprint} onClose={closeDialog} onSaved={afterChange} />
            )}

            {dialog?.type === "start-sprint" && (
                <StartSprintDialog sprint={dialog.sprint} onClose={closeDialog} onStarted={afterChange} />
            )}

            {dialog?.type === "delete-sprint" && (
                <ConfirmDialog
                    title={`Delete ${dialog.sprint.name}?`}
                    message={
                        dialog.sprint.tasks.length > 0
                            ? "Its tasks go back to their places in the backlog. The tasks themselves are kept."
                            : "This empty sprint will be removed."
                    }
                    confirmLabel="Delete sprint"
                    tone="danger"
                    loading={removeSprint.submitting}
                    error={removeSprint.error}
                    onConfirm={handleDeleteSprint}
                    onClose={() => {
                        closeDialog();
                        removeSprint.clearError();
                    }}
                />
            )}
        </Box>
    );
};

export default SprintsTab;
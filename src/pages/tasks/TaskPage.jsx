import { Link as RouterLink, useParams } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LoadState from "../../components/general/LoadState";
import ToneChip from "../../components/general/ToneChip";
import UserAvatar from "../../components/general/UserAvatar";
import { getBoard, getProject, listProjectMembers } from "../../api/projectsApi";
import { getTask } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { TASK_ERROR_MESSAGES, TASK_PRIORITIES, TASK_STAGES, TASK_TYPES } from "../../constants/tasks";
import { memberLabel } from "../../utils/people";
import { projectPath } from "../../utils/project";
import { formatEstimate, labelTone, taskStage } from "../../utils/task";

// one row of the details card: a label on the left, the value on the right
const Detail = ({ label, children }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 1, py: 1.25 }}>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
);

const None = () => <Typography color="text.disabled">None</Typography>;

// an icon with a label, for the type and the priority
const IconValue = ({ value }) =>
    value ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <value.Icon fontSize="small" sx={{ color: value.tone }} />
            {value.label}
        </Box>
    ) : (
        <None />
    );

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

// The task's own page: every field in read-only mode (the drawer is where tasks are edited).
const TaskPage = () => {
    const { projectId, taskId } = useParams();
    const state = useAsync(
        async (signal) => {
            const [project, task, board, members] = await Promise.all([
                getProject(projectId, signal),
                getTask(projectId, taskId, signal),
                getBoard(projectId, signal),
                listProjectMembers(projectId, { size: 100 }, signal),
            ]);
            return { project, task, columns: board.columns, members: members.content };
        },
        [projectId, taskId],
        { fallback: "Couldn't load the task. Please try again.", messages: TASK_ERROR_MESSAGES },
    );

    if (!state.data) {
        return (
            <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={6} />
            </Paper>
        );
    }

    const { project, task, columns, members } = state.data;
    const type = TASK_TYPES[task.type];
    // the response only has assigneeId: the member list gives the name, or at least the id
    const assignee =
        task.assigneeId == null ? null : (members.find((m) => m.userId === task.assigneeId) ?? { userId: task.assigneeId });
    const estimate = formatEstimate(task.estimate);

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
            <Button component={RouterLink} to={projectPath(project)} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                Back to {project.name}
            </Button>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                {type && <type.Icon fontSize="small" sx={{ color: type.tone }} />}
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                    {task.key}
                </Typography>
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3, wordBreak: "break-word" }}>
                {task.title}
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 2fr) minmax(0, 1fr)" },
                    gap: 3,
                    alignItems: "start",
                }}
            >
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Description</Typography>
                    {task.description ? (
                        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{task.description}</Typography>
                    ) : (
                        <Typography color="text.disabled">No description</Typography>
                    )}
                </Paper>

                <Paper elevation={0} sx={{ px: 3, py: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Detail label="Status">
                        <ToneChip label={task.statusName} tone={TASK_STAGES[taskStage(task.statusId, columns)].tone} />
                    </Detail>
                    <Detail label="Type">
                        <IconValue value={type} />
                    </Detail>
                    <Detail label="Priority">
                        <IconValue value={TASK_PRIORITIES[task.priority]} />
                    </Detail>
                    <Detail label="Assignee">
                        {assignee ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <UserAvatar user={assignee} size={26} />
                                {memberLabel(assignee)}
                            </Box>
                        ) : (
                            <Typography color="text.disabled">Unassigned</Typography>
                        )}
                    </Detail>
                    <Detail label="Estimate">{estimate ? <Typography>{estimate} points</Typography> : <None />}</Detail>
                    <Detail label="Labels">
                        {task.labels?.length ? (
                            <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap" }}>
                                {task.labels.map((label) => (
                                    <ToneChip key={label} label={label} tone={labelTone(label)} />
                                ))}
                            </Stack>
                        ) : (
                            <None />
                        )}
                    </Detail>
                    <Detail label="Created">
                        <Typography variant="body2">{formatDate(task.createdAt)}</Typography>
                    </Detail>
                    <Detail label="Updated">
                        <Typography variant="body2">{formatDate(task.updatedAt)}</Typography>
                    </Detail>
                </Paper>
            </Box>
        </Box>
    );
};

export default TaskPage;
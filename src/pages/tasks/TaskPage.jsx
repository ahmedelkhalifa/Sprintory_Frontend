import { useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Autocomplete,
    Box,
    Breadcrumbs,
    Button,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ConfirmDialog from "../../components/general/ConfirmDialog";
import LoadState from "../../components/general/LoadState";
import UserAvatar from "../../components/general/UserAvatar";
import PageLayout from "../../components/layouts/PageLayout";
import { getBoard, listProjectMembers } from "../../api/projectsApi";
import { deleteTask, getTask, updateTask } from "../../api/tasksApi";
import { useAsync } from "../../hooks/useAsync";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { useSubmit } from "../../hooks/useSubmit";
import { PERMISSIONS } from "../../constants/projects";
import { TASK_ERROR_MESSAGES, TASK_PRIORITIES, TASK_STAGES, TASK_TYPES } from "../../constants/tasks";
import { memberLabel } from "../../utils/people";
import { can, projectPath } from "../../utils/project";
import { formatEstimate, taskStage } from "../../utils/task";
import { TASK_TITLE_MAX } from "../../utils/validation";

// fields look like plain text until hovered or focused, like Jira's
const inlineSx = {
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
};

// one row of the Details card: the label on the left, the field on the right
const Row = ({ label, children }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr)", alignItems: "center", gap: 1, py: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
);

// a select built from one of the task value maps (types, priorities)
const ValueSelect = ({ id, value, values, onChange, disabled }) => (
    <TextField
        select
        fullWidth
        size="small"
        id={id}
        value={value}
        disabled={disabled}
        sx={inlineSx}
        onChange={(e) => onChange(e.target.value)}
    >
        {Object.values(values).map(({ value: v, label, Icon, tone }) => (
            <MenuItem key={v} value={v}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Icon fontSize="small" sx={{ color: tone }} />
                    {label}
                </Box>
            </MenuItem>
        ))}
    </TextField>
);

// the title: text until clicked, then a field. Enter or leaving it saves, Escape cancels
const TitleField = ({ title, canEdit, onSave }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(title);
    const [error, setError] = useState("");
    const done = useRef(false);

    const start = () => {
        if (!canEdit) return;
        done.current = false;
        setValue(title);
        setError("");
        setEditing(true);
    };

    const finish = (save) => {
        if (done.current) return;
        const trimmed = value.trim();
        if (save && !trimmed) return setError("Title is required.");
        done.current = true;
        setEditing(false);
        if (save && trimmed !== title) onSave(trimmed);
    };

    if (!editing) {
        return (
            <Typography
                variant="h4"
                component="h1"
                onClick={start}
                sx={{
                    fontWeight: 700,
                    wordBreak: "break-word",
                    borderRadius: 1,
                    px: 1,
                    mx: -1,
                    cursor: canEdit ? "text" : "default",
                    "&:hover": canEdit ? { bgcolor: "action.hover" } : undefined,
                }}
            >
                {title}
            </Typography>
        );
    }
    return (
        <TextField
            autoFocus
            fullWidth
            value={value}
            error={Boolean(error)}
            helperText={error}
            onChange={(e) => {
                setValue(e.target.value);
                setError("");
            }}
            onBlur={() => finish(true)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    finish(true);
                }
                if (e.key === "Escape") finish(false);
            }}
            slotProps={{
                htmlInput: { maxLength: TASK_TITLE_MAX, "aria-label": "Title" },
                input: { sx: { fontSize: 28, fontWeight: 700 } },
            }}
        />
    );
};

// the description: text until clicked, then a box with Save and Cancel
const DescriptionField = ({ description, canEdit, onSave }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(description ?? "");

    if (editing) {
        return (
            <Box>
                <TextField
                    autoFocus
                    multiline
                    fullWidth
                    minRows={6}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    slotProps={{ htmlInput: { "aria-label": "Description" } }}
                />
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            setEditing(false);
                            if (value.trim() !== (description ?? "")) onSave(value.trim());
                        }}
                    >
                        Save
                    </Button>
                    <Button size="small" color="inherit" onClick={() => setEditing(false)}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        );
    }
    return (
        <Box
            role={canEdit ? "button" : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onClick={() => {
                if (!canEdit) return;
                setValue(description ?? "");
                setEditing(true);
            }}
            sx={{
                borderRadius: 1,
                px: 1,
                py: 0.5,
                mx: -1,
                minHeight: 40,
                cursor: canEdit ? "text" : "default",
                "&:hover": canEdit ? { bgcolor: "action.hover" } : undefined,
            }}
        >
            {description ? (
                <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{description}</Typography>
            ) : (
                <Typography color="text.disabled">{canEdit ? "Add a description..." : "No description"}</Typography>
            )}
        </Box>
    );
};

// the task's page: the loaded task and its editable fields. Every change is saved at once, like in Jira.
const TaskView = ({ workspace, project, initialTask, columns, members }) => {
    const navigate = useNavigate();
    const [task, setTask] = useState(initialTask);
    const [estimate, setEstimate] = useState(formatEstimate(initialTask.estimate));
    const [estimateError, setEstimateError] = useState("");
    const [menu, setMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const save = useSubmit(TASK_ERROR_MESSAGES);
    const remove = useSubmit(TASK_ERROR_MESSAGES);
    const canEdit = can(project, PERMISSIONS.EDIT_TASKS);

    // changes = only the fields that change (see taskChanges in utils/task.js); the response is the updated task
    const commit = async (changes) => {
        save.clearError();
        const { ok } = await save.run(async () => {
            const updated = await updateTask(project.id, task.id, changes);
            setTask(updated);
            setEstimate(formatEstimate(updated.estimate));
        });
        if (!ok) setEstimate(formatEstimate(task.estimate)); // put the typed estimate back after a refusal
    };

    const commitEstimate = () => {
        const text = estimate.trim();
        if (text === formatEstimate(task.estimate)) return setEstimateError("");
        if (text === "") {
            setEstimateError("");
            return commit({ clearEstimate: true });
        }
        const points = Number(text);
        if (!Number.isFinite(points) || points < 0) return setEstimateError("Enter 0 or more.");
        setEstimateError("");
        return commit({ estimate: points });
    };

    const handleDelete = async () => {
        const { ok } = await remove.run(() => deleteTask(project.id, task.id));
        if (ok) navigate(projectPath(workspace, project));
    };

    // the response only has assigneeId: the member list gives the name, or at least the id
    const assignee =
        task.assigneeId == null ? null : (members.find((m) => m.userId === task.assigneeId) ?? { userId: task.assigneeId });

    const statusSx = canEdit
        ? {
            bgcolor: "primary.main",
            borderRadius: 1,
            "& .MuiSelect-select": { color: "primary.contrastText", fontWeight: 600 },
            "& .MuiSvgIcon-root": { color: "primary.contrastText" },
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        }
        : inlineSx;

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link component={RouterLink} to={projectPath(workspace, project)} underline="hover" color="inherit">
                    {project.name}
                </Link>
                <Typography color="text.primary">{task.key}</Typography>
            </Breadcrumbs>

            {save.error && (
                <Alert severity="error" onClose={save.clearError} sx={{ mb: 2 }}>
                    {save.error}
                </Alert>
            )}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 380px" },
                    gap: 4,
                    alignItems: "start",
                }}
            >
                {/* left: the title, the description and the activity */}
                <Box>
                    <TitleField title={task.title} canEdit={canEdit} onSave={(title) => commit({ title })} />

                    <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>Description</Typography>
                    <DescriptionField
                        key={task.updatedAt}
                        description={task.description}
                        canEdit={canEdit}
                        onSave={(text) => commit(text ? { description: text } : { clearDescription: true })}
                    />

                    <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>Activity</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comments and history will appear here once they are available.
                    </Typography>
                </Box>

                {/* right: the status, the details and the dates */}
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <TextField
                            select
                            size="small"
                            value={task.statusId}
                            disabled={!canEdit}
                            onChange={(e) => commit({ statusId: e.target.value })}
                            sx={{ minWidth: 160, ...statusSx }}
                            slotProps={{ htmlInput: { "aria-label": "Status" } }}
                        >
                            {columns.map((column) => (
                                <MenuItem key={column.id} value={column.id}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                bgcolor: TASK_STAGES[taskStage(column.id, columns)].tone,
                                            }}
                                        />
                                        {column.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ flexGrow: 1 }} />
                        {canEdit && (
                            <>
                                <IconButton aria-label="More actions" onClick={(e) => setMenu(e.currentTarget)}>
                                    <MoreHorizIcon />
                                </IconButton>
                                <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
                                    <MenuItem
                                        sx={{ color: "error.main" }}
                                        onClick={() => {
                                            setMenu(null);
                                            setConfirmDelete(true);
                                        }}
                                    >
                                        Delete task
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>

                    <Accordion
                        defaultExpanded
                        disableGutters
                        elevation={0}
                        sx={{ border: 1, borderColor: "divider", borderRadius: 2, "&:before": { display: "none" } }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ fontWeight: 600 }}>Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Row label="Assignee">
                                <Autocomplete
                                    value={assignee}
                                    options={members}
                                    disabled={!canEdit}
                                    onChange={(_, member) =>
                                        commit(member ? { assigneeId: member.userId } : { clearAssignee: true })
                                    }
                                    getOptionLabel={memberLabel}
                                    isOptionEqualToValue={(option, value) => option.userId === value.userId}
                                    noOptionsText="No members"
                                    sx={inlineSx}
                                    renderOption={({ key, ...props }, member) => (
                                        <Box component="li" key={key} {...props} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                            <UserAvatar user={member} size={26} />
                                            {memberLabel(member)}
                                        </Box>
                                    )}
                                    renderInput={(params) => <TextField {...params} size="small" placeholder="Unassigned" />}
                                />
                            </Row>
                            <Row label="Priority">
                                <ValueSelect
                                    id="task-priority"
                                    value={task.priority}
                                    values={TASK_PRIORITIES}
                                    disabled={!canEdit}
                                    onChange={(priority) => commit({ priority })}
                                />
                            </Row>
                            <Row label="Type">
                                <ValueSelect
                                    id="task-type"
                                    value={task.type}
                                    values={TASK_TYPES}
                                    disabled={!canEdit}
                                    onChange={(type) => commit({ type })}
                                />
                            </Row>
                            <Row label="Labels">
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    options={[]}
                                    value={task.labels ?? []}
                                    disabled={!canEdit}
                                    onChange={(_, next) => commit({ labels: [...new Set(next.map((l) => l.trim()).filter(Boolean))] })}
                                    sx={inlineSx}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            placeholder={task.labels?.length ? "" : canEdit ? "Add labels" : "None"}
                                        />
                                    )}
                                />
                            </Row>
                            <Row label="Story points">
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={estimate}
                                    disabled={!canEdit}
                                    placeholder={canEdit ? "Add an estimate" : "None"}
                                    error={Boolean(estimateError)}
                                    helperText={estimateError}
                                    onChange={(e) => setEstimate(e.target.value)}
                                    onBlur={commitEstimate}
                                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                                    sx={inlineSx}
                                    slotProps={{ htmlInput: { min: 0, step: 1, "aria-label": "Story points" } }}
                                />
                            </Row>
                        </AccordionDetails>
                    </Accordion>

                    <Box sx={{ mt: 2, px: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Created {new Date(task.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Updated {new Date(task.updatedAt).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {confirmDelete && (
                <ConfirmDialog
                    title="Delete this task?"
                    message={`${task.key} "${task.title}" will be deleted. This can't be undone.`}
                    confirmLabel="Delete task"
                    destructive
                    loading={remove.submitting}
                    error={remove.error}
                    onConfirm={handleDelete}
                    onClose={() => {
                        setConfirmDelete(false);
                        remove.clearError();
                    }}
                />
            )}
        </Box>
    );
};

// /workspaces/:workspaceSlug/projects/:projectId/tasks/:taskId
// the project and workspace come from the guards; this loads the task, the board's columns and the members
const TaskPage = () => {
    const { taskId } = useParams();
    const { workspace } = useWorkspaceAccess();
    const { project } = useProjectAccess();
    const state = useAsync(
        async (signal) => {
            const [task, board, members] = await Promise.all([
                getTask(project.id, taskId, signal),
                getBoard(project.id, signal),
                listProjectMembers(project.id, { size: 100 }, signal),
            ]);
            return { task, columns: board.columns, members: members.content };
        },
        [project.id, taskId],
        { fallback: "Couldn't load the task. Please try again.", messages: TASK_ERROR_MESSAGES },
    );

    return (
        <PageLayout>
            {state.data ? (
                <TaskView
                    key={state.data.task.id}
                    workspace={workspace}
                    project={project}
                    initialTask={state.data.task}
                    columns={state.data.columns}
                    members={state.data.members}
                />
            ) : (
                <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={6} />
                </Paper>
            )}
        </PageLayout>
    );
};

export default TaskPage;
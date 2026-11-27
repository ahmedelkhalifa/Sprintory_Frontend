import { useState } from "react";
import { Autocomplete, Box, TextField, Tooltip, Typography } from "@mui/material";
import { listMilestones, setTaskMilestone, USE_MOCK } from "../../api/milestonesApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { PERMISSIONS } from "../../constants/projects";
import { MILESTONE_ERROR_MESSAGES } from "../../constants/tasks";
import { can } from "../../utils/project";
import { formatDate } from "../../utils/format";

const TaskMilestoneField = ({ id = "task-milestone", project, task, writable = true, onUpdated }) => {
    const isSubtask = task.parentTaskId != null;
    const canLink = writable && !isSubtask && (USE_MOCK || can(project, PERMISSIONS.MILESTONE_LINK));
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(task.milestone ?? null);
    const [prevTaskId, setPrevTaskId] = useState(task.id);
    const submit = useSubmit(MILESTONE_ERROR_MESSAGES);

    if (task.id !== prevTaskId) {
        setPrevTaskId(task.id);
        setSelected(task.milestone ?? null);
    }
    const milestonesState = useAsync((signal) => listMilestones(project.id, signal), [project.id], {
        enabled: canLink,
    });

    const options = milestonesState.data?.milestones ?? [];
    const allOptions =
        selected && !options.some((m) => m.id === selected.id) ? [selected, ...options] : options;

    const handleChange = async (_, next) => {
        const milestoneId = next?.id ?? null;
        setError("");
        const { ok, error: err, result } = await submit.run(() => setTaskMilestone(task.id, milestoneId));
        if (ok) {
            const updatedMilestone =
                result?.milestone ?? (next ? { id: next.id, name: next.name, targetDate: next.targetDate } : null);
            setSelected(updatedMilestone);
            onUpdated?.({ ...task, milestone: updatedMilestone });
        } else if (err) {
            setError(submit.error || "Couldn't update milestone.");
        }
    };

    const tooltipText = selected?.targetDate ? `Target date: ${formatDate(selected.targetDate)}` : "";

    return (
        <Tooltip title={tooltipText} placement="left">
            <div>
                <Autocomplete
                    id={id}
                    size="small"
                    options={allOptions}
                    value={selected}
                    disabled={!canLink || submit.submitting}
                    loading={milestonesState.loading}
                    getOptionLabel={(option) => option.name ?? ""}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    onChange={handleChange}
                    noOptionsText="No milestones found"
                    renderOption={(props, option) => {
                        const { key, ...rest } = props;
                        return (
                            <Box component="li" key={key} {...rest} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography variant="body2" noWrap>
                                    {option.name}
                                </Typography>
                                {option.targetDate && (
                                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                        {formatDate(option.targetDate)}
                                    </Typography>
                                )}
                            </Box>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={canLink ? "No milestone" : "None"}
                            error={Boolean(error)}
                            helperText={error || (isSubtask ? "Inherited from parent task" : "")}
                        />
                    )}
                />
            </div>
        </Tooltip>
    );
};

export default TaskMilestoneField;
import { useState } from "react";
import { MenuItem, Tooltip } from "@mui/material";
import FormField from "../forms/FormField";
import { listMilestones, setTaskMilestone } from "../../api/milestonesApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { PERMISSIONS } from "../../constants/projects";
import { MILESTONE_ERROR_MESSAGES } from "../../constants/tasks";
import { can } from "../../utils/project";
import { formatDate } from "../../utils/format";

const TaskMilestoneField = ({ id = "task-milestone", project, task, writable = true, onUpdated }) => {
    const isSubtask = task.parentTaskId != null;
    const canLink = writable && !isSubtask && can(project, PERMISSIONS.MILESTONE_LINK);
    const [error, setError] = useState("");
    const submit = useSubmit(MILESTONE_ERROR_MESSAGES);

    const milestonesState = useAsync((signal) => listMilestones(project.id, signal), [project.id], {
        enabled: canLink,
    });

    const options = milestonesState.data?.milestones ?? [];
    const currentId = task.milestone?.id ?? "";

    // Чтобы выбранная веха всегда была в списке опций до загрузки списка
    const allOptions =
        task.milestone && !options.some((m) => m.id === task.milestone.id)
            ? [task.milestone, ...options]
            : options;

    const handleChange = async (e) => {
        const nextVal = e.target.value;
        const milestoneId = nextVal === "" ? null : Number(nextVal);
        setError("");
        const { ok, error: err, result } = await submit.run(() => setTaskMilestone(task.id, milestoneId));
        if (ok) {
            const picked = milestoneId ? allOptions.find((m) => m.id === milestoneId) ?? null : null;
            const updatedMilestone = result?.milestone ?? (picked ? { id: picked.id, name: picked.name, targetDate: picked.targetDate } : null);
            onUpdated?.({ ...task, milestone: updatedMilestone });
        } else if (err) {
            setError(submit.error || "Couldn't update milestone.");
        }
    };

    const tooltipText = task.milestone?.targetDate ? `Target date: ${formatDate(task.milestone.targetDate)}` : "";

    return (
        <Tooltip title={tooltipText} placement="left">
            <div>
                <FormField
                    id={id}
                    select
                    value={currentId}
                    disabled={!canLink || submit.submitting}
                    onChange={handleChange}
                    error={Boolean(error)}
                    helperText={error || (isSubtask ? "Inherited from parent task" : "")}
                    SelectProps={{ displayEmpty: true }}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {allOptions.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                            {m.name}
                        </MenuItem>
                    ))}
                </FormField>
            </div>
        </Tooltip>
    );
};

export default TaskMilestoneField;
import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import { createMilestone, updateMilestone } from "../../api/milestonesApi";
import { useSubmit } from "../../hooks/useSubmit";
import { MILESTONE_ERROR_MESSAGES } from "../../constants/tasks";

const MilestoneDialog = ({ projectId, milestone = null, onClose, onSaved }) => {
    const isEdit = Boolean(milestone);
    const [values, setValues] = useState({
        name: milestone?.name ?? "",
        targetDate: milestone?.targetDate ?? "",
        description: milestone?.description ?? "",
    });
    const [errors, setErrors] = useState({});
    const submit = useSubmit(MILESTONE_ERROR_MESSAGES);

    const change = (field) => (e) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const found = {};
        const trimmedName = values.name.trim();
        if (!trimmedName) found.name = "Name is required.";
        else if (trimmedName.length > 100) found.name = "Maximum 100 characters.";
        if (!values.targetDate) found.targetDate = "Target date is required.";
        if (values.description.length > 500) found.description = "Maximum 500 characters.";

        setErrors(found);
        if (Object.keys(found).length > 0) return;

        const payload = {
            name: trimmedName,
            targetDate: values.targetDate,
            description: values.description.trim() || null,
        };

        const { ok, error, result } = await submit.run(() =>
            isEdit ? updateMilestone(milestone.id, payload) : createMilestone(projectId, payload),
        );
        if (ok) {
            onSaved(result);
            return;
        }

        const data = error?.response?.data;
        if (data?.code === "VALIDATION_ERROR" && data.fieldErrors) {
            setErrors(data.fieldErrors);
            submit.clearError();
        } else if (data?.code === "MILESTONE_NAME_TAKEN") {
            setErrors({ name: MILESTONE_ERROR_MESSAGES.MILESTONE_NAME_TAKEN });
            submit.clearError();
        }
    };

    return (
        <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
            <Box component="form" noValidate onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>{isEdit ? "Edit milestone" : "Add milestone"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormField
                            id="milestone-name"
                            label="Name"
                            required
                            placeholder="e.g. Beta release"
                            value={values.name}
                            onChange={change("name")}
                            error={Boolean(errors.name)}
                            helperText={errors.name}
                            slotProps={{ htmlInput: { maxLength: 100 } }}
                        />
                        <FormField
                            id="milestone-target-date"
                            label="Target date"
                            type="date"
                            required
                            value={values.targetDate}
                            onChange={change("targetDate")}
                            error={Boolean(errors.targetDate)}
                            helperText={errors.targetDate}
                        />
                        <FormField
                            id="milestone-description"
                            label="Description"
                            placeholder="Optional description"
                            multiline
                            minRows={3}
                            value={values.description}
                            onChange={change("description")}
                            error={Boolean(errors.description)}
                            helperText={errors.description || `${values.description.length} / 500`}
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                        />
                        {submit.error && <Alert severity="error">{submit.error}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={onClose} disabled={submit.submitting} color="inherit">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" loading={submit.submitting}>
                        {isEdit ? "Save" : "Create milestone"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default MilestoneDialog;
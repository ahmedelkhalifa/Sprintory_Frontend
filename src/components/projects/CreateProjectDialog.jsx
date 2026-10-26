import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import TemplatePicker from "./TemplatePicker";
import { createProject } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { projectPath, suggestProjectKey } from "../../utils/project";
import { PROJECT_KEY_MAX, validateNewProject } from "../../utils/validation";
import { PROJECT_ERROR_MESSAGES, TEMPLATES } from "../../constants/projects";

// backend field messages are lowercase ("must not be blank"); start them with a capital letter
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// "Create project" window: name, key, template and an optional description. The key is suggested from the name
// until the user types their own. The creator becomes the project's Project Manager, and on success we open it.
const CreateProjectDialog = ({ workspaceId, onClose }) => {
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", key: "", description: "" });
  // once the user edits the key, the name stops changing it
  const [keyTouched, setKeyTouched] = useState(false);
  const [template, setTemplate] = useState(TEMPLATES.SCRUM.value);
  const [errors, setErrors] = useState({});
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);

  const set = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" && !keyTouched && { key: suggestProjectKey(value) }),
    }));
    setErrors((prev) => ({ ...prev, [field]: "", ...(field === "name" && !keyTouched && { key: "" }) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateNewProject(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: values.name.trim(),
      key: values.key.trim().toUpperCase(),
      template,
      description: values.description.trim() || undefined,
    };
    const { ok, result, error: apiError } = await submit.run(() => createProject(workspaceId, body));
    if (ok) {
      navigate(projectPath(result));
      return;
    }
    // the backend names the bad field: show it under the field instead of in the alert
    const data = apiError.response?.data;
    if (data?.code === "PROJECT_KEY_TAKEN") {
      setErrors({ key: data.message });
      submit.clearError();
    } else if (data?.code === "VALIDATION_ERROR" && (data.fieldErrors?.name || data.fieldErrors?.key)) {
      setErrors(
        Object.fromEntries(
          ["name", "key"].filter((field) => data.fieldErrors[field]).map((field) => [field, capitalize(data.fieldErrors[field])]),
        ),
      );
      submit.clearError();
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Create project</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2.5 }}>
            You'll be the project's Project Manager and can add people afterwards.
          </Typography>
          <Stack spacing={2.5}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 2fr) minmax(0, 1fr)" }, gap: 2 }}>
              <FormField
                id="project-name"
                label="Project name"
                placeholder="e.g. Mobile App"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
                autoFocus
              />
              <FormField
                id="project-key"
                label="Project key"
                placeholder="e.g. MA"
                value={values.key}
                onChange={(e) => {
                  setKeyTouched(true);
                  set("key", e.target.value.toUpperCase());
                }}
                error={Boolean(errors.key)}
                helperText={errors.key || "Starts task keys, like MA-12"}
                slotProps={{ htmlInput: { maxLength: PROJECT_KEY_MAX, autoCapitalize: "characters" } }}
              />
            </Box>
            <TemplatePicker value={template} onChange={setTemplate} />
            <FormField
              id="project-description"
              label="Description"
              placeholder="Optional: what is this project about?"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              multiline
              minRows={2}
            />
            <Alert severity="info">The key and the template can't be changed after the project is created.</Alert>
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            Create project
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CreateProjectDialog;

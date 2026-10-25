import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import TemplatePicker from "./TemplatePicker";
import { createProject } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { projectPath } from "../../utils/project";
import { validateProjectName } from "../../utils/validation";
import { PROJECT_ERROR_MESSAGES, TEMPLATES } from "../../constants/projects";

// backend field messages are lowercase ("must not be blank"); start them with a capital letter
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// "Create project" window: a name and a template. The creator becomes the project's Project Manager,
// and on success we open the new project.
const CreateProjectDialog = ({ workspaceId, onClose }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState(TEMPLATES.SCRUM.value);
  const [nameError, setNameError] = useState("");
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateProjectName(name);
    setNameError(error);
    if (error) return;

    const { ok, result, error: apiError } = await submit.run(() =>
      createProject(workspaceId, { name: name.trim(), template }),
    );
    if (ok) {
      navigate(projectPath(result));
      return;
    }
    // the backend names the bad field: show it under the field instead of in the alert
    const data = apiError.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors?.name) {
      setNameError(capitalize(data.fieldErrors.name));
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
            <FormField
              id="project-name"
              label="Project name"
              placeholder="e.g. Mobile App"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              error={Boolean(nameError)}
              helperText={nameError}
              autoFocus
            />
            <TemplatePicker value={template} onChange={setTemplate} />
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

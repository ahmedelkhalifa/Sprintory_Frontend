import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import FormField from "../forms/FormField";
import { updateProject } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { getFieldErrors } from "../../utils/apiErrors";
import { validateProjectName } from "../../utils/validation";
import { PROJECT_ERROR_MESSAGES } from "../../constants/projects";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// "Edit project" window: rename a project (the template can't be changed). ASSUMED endpoint until story 8.
const EditProjectDialog = ({ project, onClose, onSaved }) => {
  const [name, setName] = useState(project.name);
  const [nameError, setNameError] = useState("");
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateProjectName(name);
    setNameError(error);
    if (error) return;

    const { ok, result, error: apiError } = await submit.run(() => updateProject(project.id, { name: name.trim() }));
    if (ok) {
      onSaved(result);
      return;
    }
    const fieldErrors = getFieldErrors(apiError);
    if (fieldErrors.name) {
      setNameError(capitalize(fieldErrors.name));
      submit.clearError();
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormField
              id="project-name"
              label="Project name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              error={Boolean(nameError)}
              helperText={nameError}
              autoFocus
            />
            {submit.error && <Alert severity="error">{submit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submit.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submit.submitting}>
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default EditProjectDialog;

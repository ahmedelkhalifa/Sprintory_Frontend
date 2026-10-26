import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import FormField from "../forms/FormField";
import TemplateChip from "./TemplateChip";
import { updateProject } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { validateProjectName } from "../../utils/validation";
import { PROJECT_ERROR_MESSAGES } from "../../constants/projects";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// a read-only "label  value" line for what can't change
const Fixed = ({ label, children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {children}
  </Box>
);

// "Edit project" window (PATCH /projects/{id}, EDIT_SETTINGS): the name and the description.
// The key and the template are fixed at creation, so they are only shown.
const EditProjectDialog = ({ project, onClose, onSaved }) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [nameError, setNameError] = useState("");
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateProjectName(name);
    setNameError(error);
    if (error) return;

    // an empty description clears it
    const body = { name: name.trim(), description: description.trim() };
    const { ok, result, error: apiError } = await submit.run(() => updateProject(project.id, body));
    if (ok) {
      onSaved(result);
      return;
    }
    const data = apiError.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors?.name) {
      setNameError(capitalize(data.fieldErrors.name));
      submit.clearError();
    }
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit project</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
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
            <FormField
              id="project-description"
              label="Description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
            />
            <Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 1 }}>
                <Fixed label="Key">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {project.key}
                  </Typography>
                </Fixed>
                <Fixed label="Template">
                  <TemplateChip template={project.template} />
                </Fixed>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                The key and the template can't be changed.
              </Typography>
            </Box>
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

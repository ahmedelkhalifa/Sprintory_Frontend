import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import ProjectFormFields from "./ProjectFormFields";
import { useProjectForm } from "../../hooks/useProjectForm";

// "Edit project" window (PATCH /projects/{id}, EDIT_SETTINGS): the name and the description.
// The key and the template are fixed at creation, so they are only shown.
const EditProjectDialog = ({ project, onClose, onSaved }) => {
  const form = useProjectForm(project, onSaved);

  return (
    <Dialog open onClose={form.submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={form.save}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit project</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <ProjectFormFields project={project} form={form} autoFocus />
            {form.error && <Alert severity="error">{form.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={form.submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={form.submitting}>
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default EditProjectDialog;

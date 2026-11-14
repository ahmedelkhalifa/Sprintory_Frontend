import { Alert, Box, Button, Stack } from "@mui/material";
import SectionCard from "../../general/SectionCard";
import ProjectFormFields from "../ProjectFormFields";
import { useProjectForm } from "../../../hooks/useProjectForm";
import { can } from "../../../utils/project";
import { PERMISSIONS } from "../../../constants/projects";

// Settings → General: name and description, edited in place; the key and template are shown but never change.
// Read-only without EDIT_SETTINGS or while archived.
const GeneralSection = ({ project, writable, onSaved }) => {
  const form = useProjectForm(project, onSaved);
  const mayEdit = can(project, PERMISSIONS.EDIT_SETTINGS);
  const editable = mayEdit && writable;

  return (
    <SectionCard title="General">
      <Box component="form" noValidate onSubmit={form.save} sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Stack spacing={2.5} sx={{ maxWidth: 640 }}>
          {!mayEdit && (
            <Alert severity="info">You can see these settings, but you don&apos;t have permission to change them.</Alert>
          )}
          <ProjectFormFields project={project} form={form} disabled={!editable} />
          {form.error && <Alert severity="error">{form.error}</Alert>}
          {editable && (
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button onClick={form.reset} disabled={!form.dirty || form.submitting} color="inherit">
                Discard changes
              </Button>
              <Button type="submit" variant="contained" disabled={!form.dirty} loading={form.submitting}>
                Save changes
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    </SectionCard>
  );
};

export default GeneralSection;

import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import SectionCard from "../general/SectionCard";
import ProjectFormFields from "./ProjectFormFields";
import { projectActionsFor } from "./projectActions";
import { useProjectForm } from "../../hooks/useProjectForm";
import { can } from "../../utils/project";
import { PERMISSIONS } from "../../constants/projects";

// what each archive / restore / delete row says; the confirmation dialog repeats it before anything happens
const STATUS_ROWS = {
  archive: {
    title: "Archive this project",
    text: "It becomes read-only and moves to the Archived tab. You can restore it at any time.",
  },
  restore: {
    title: "Restore this project",
    text: "It becomes active again, and its members can work on it.",
  },
  delete: {
    title: "Delete this project",
    text: "The project and everything in it are deleted for everyone. This can't be undone.",
  },
};

// name and description, edited in place; read-only without EDIT_SETTINGS or while archived
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

// The project's Settings tab: General (name, description, fixed key and template) and, for people with
// ARCHIVE_PROJECT, archive / restore / delete. Those open the same confirmation dialogs as the
// "Project settings" menu, through `onAction(type)`; `onSaved` runs after the name or description changed.
const ProjectSettingsTab = ({ project, writable, workspaceArchived, onSaved, onAction }) => {
  // the menu's edit item is this tab's General section; an archived workspace allows none of them
  const statusActions = workspaceArchived ? [] : projectActionsFor(project).filter(({ action }) => action !== "edit");

  return (
    <Stack spacing={3}>
      {/* restarts the form when the saved values change, e.g. after the header's Edit project window */}
      <GeneralSection
        key={`${project.name}\n${project.description ?? ""}`}
        project={project}
        writable={writable}
        onSaved={onSaved}
      />

      {statusActions.length > 0 && (
        <SectionCard title="Archive or delete">
          {statusActions.map(({ action, label, Icon, danger }, index) => (
            <Box key={action}>
              {index > 0 && <Divider />}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                  px: { xs: 2, sm: 3 },
                  py: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{STATUS_ROWS[action].title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {STATUS_ROWS[action].text}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color={danger ? "error" : "inherit"}
                  startIcon={<Icon />}
                  onClick={() => onAction(action)}
                  sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" }, borderColor: danger ? undefined : "divider" }}
                >
                  {label}
                </Button>
              </Box>
            </Box>
          ))}
        </SectionCard>
      )}
    </Stack>
  );
};

export default ProjectSettingsTab;

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { setProjectMemberRoles } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { PROJECT_ERROR_MESSAGES, PROJECT_ROLE_DESCRIPTIONS, ROLE_MESSAGES } from "../../constants/projects";
import { memberLabel } from "../../utils/people";
import {
  projectRoleLabel,
  projectRoleOptions,
  sameRoles,
  sortProjectRoles,
  toggleProjectRole,
  validateProjectRoles,
} from "../../utils/project";

const ERRORS = {
  ...PROJECT_ERROR_MESSAGES,
  RESOURCE_NOT_FOUND: "This person is no longer a member of the project, or the project no longer exists.",
  // INVALID_PROJECT_ROLES has no entry: the backend message says which rule was broken
};

// "Change roles" window: tick one or more of the roles the project's template offers (Scrum: Project Manager,
// Product Owner, Scrum Master, Developer, Viewer; Kanban: Project Manager, Member, Viewer). The new set replaces
// the old one in this project only. Viewer is exclusive, and the last role can't be unticked.
// The backend refuses removing the last Project Manager (LAST_PROJECT_MANAGER), shown in the window.
const ProjectRolesDialog = ({ project, member, onClose, onSaved }) => {
  const template = project.template;
  const [roles, setRoles] = useState(() => sortProjectRoles(member.roles, template));
  // the refusal shown when the user unticks the last role
  const [hint, setHint] = useState("");
  const submit = useSubmit(ERRORS);
  const name = memberLabel(member);

  const toggle = (role) => {
    submit.clearError();
    const next = toggleProjectRole(roles, role, template);
    if (next.length === 0) {
      setHint(ROLE_MESSAGES.EMPTY);
      return;
    }
    setHint("");
    setRoles(next);
  };

  const unchanged = sameRoles(roles, sortProjectRoles(member.roles, template));
  const invalid = validateProjectRoles(roles, template);

  const handleSave = async () => {
    const { ok } = await submit.run(() => setProjectMemberRoles(project.id, member.userId, roles));
    if (ok) onSaved(member);
  };

  return (
    <Dialog open onClose={submit.submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Roles of {name}
        <Typography variant="body2" color="text.secondary">
          In {project.name} only
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 1.5 }}>
        <List disablePadding aria-label="Project roles">
          {projectRoleOptions(template).map((role) => (
            <ListItemButton
              key={role}
              dense
              disabled={submit.submitting}
              selected={roles.includes(role)}
              onClick={() => toggle(role)}
              sx={{ borderRadius: 1.5, alignItems: "flex-start" }}
            >
              <ListItemIcon sx={{ minWidth: 40, mt: 0.25 }}>
                <Checkbox
                  edge="start"
                  tabIndex={-1}
                  disableRipple
                  checked={roles.includes(role)}
                  slotProps={{ input: { "aria-label": projectRoleLabel(role, template) } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={projectRoleLabel(role, template)}
                secondary={PROJECT_ROLE_DESCRIPTIONS[role]}
                slotProps={{ primary: { fontWeight: 600 } }}
              />
            </ListItemButton>
          ))}
        </List>

        {(hint || submit.error) && (
          <Box sx={{ px: 1.5, pt: 1.5 }}>
            <Alert severity={submit.error ? "error" : "warning"}>{submit.error || hint}</Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submit.submitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={submit.submitting}
          disabled={unchanged || Boolean(invalid)}
          variant="contained"
        >
          Save roles
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectRolesDialog;

import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ConfirmDialog from "../general/ConfirmDialog";
import { archiveProject, deleteProject, restoreProject } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { PROJECT_ERROR_MESSAGES } from "../../constants/projects";

// what each action says and does (all ASSUMED endpoints until R30)
const ACTIONS = {
  archive: {
    title: (name) => `Archive "${name}"?`,
    message: "It moves to the Archived tab and becomes read-only. You can restore it at any time.",
    confirmLabel: "Archive",
    // nothing is lost, but the project stops being editable
    tone: "warning",
    Icon: ArchiveOutlinedIcon,
    run: archiveProject,
  },
  restore: {
    title: (name) => `Restore "${name}"?`,
    message: "It becomes active again, and its members can work on it.",
    confirmLabel: "Restore",
    run: restoreProject,
  },
  delete: {
    title: (name) => `Delete "${name}"?`,
    message: "The project and its member list are deleted for everyone. This cannot be undone.",
    confirmLabel: "Delete project",
    tone: "danger",
    run: deleteProject,
  },
};

// Confirmation for archive / restore / delete of one project
const ProjectStatusDialog = ({ action, project, onClose, onDone }) => {
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);
  const { title, message, confirmLabel, tone, Icon, run } = ACTIONS[action];

  const handleConfirm = async () => {
    const { ok } = await submit.run(() => run(project.id));
    if (ok) onDone();
  };

  return (
    <ConfirmDialog
      title={title(project.name)}
      message={message}
      confirmLabel={confirmLabel}
      tone={tone}
      Icon={Icon}
      loading={submit.submitting}
      error={submit.error}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
};

export default ProjectStatusDialog;

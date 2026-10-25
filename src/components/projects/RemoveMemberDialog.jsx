import ConfirmDialog from "../general/ConfirmDialog";
import { removeProjectMember } from "../../api/projectsApi";
import { useSubmit } from "../../hooks/useSubmit";
import { PROJECT_ERROR_MESSAGES } from "../../constants/projects";

// "Remove … from the project?" confirmation. They keep their workspace and team memberships.
// The last Project Manager can't be removed: the backend answers LAST_PROJECT_MANAGER, shown in the window.
const RemoveMemberDialog = ({ project, member, onClose, onRemoved }) => {
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);
  const name = `${member.firstName} ${member.lastName}`;

  const handleConfirm = async () => {
    const { ok } = await submit.run(() => removeProjectMember(project.id, member.userId));
    if (ok) onRemoved(member);
  };

  return (
    <ConfirmDialog
      title={`Remove ${name}?`}
      message={`${name} loses access to ${project.name} right away. They stay in the workspace and in their teams.`}
      confirmLabel="Remove"
      destructive
      loading={submit.submitting}
      error={submit.error}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
};

export default RemoveMemberDialog;

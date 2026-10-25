import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { can } from "../../utils/permissions";
import { PERMISSIONS, PROJECT_STATUS } from "../../constants/projects";

// The project actions this user may use, by permission and status. Shared by the ⋮ menu in the
// projects list and the "Project settings" menu on the project page, so both always agree.
export const projectActionsFor = (project) => {
  const active = project.status !== PROJECT_STATUS.ARCHIVED;
  const mayArchive = can(project, PERMISSIONS.ARCHIVE_PROJECT);
  return [
    active && can(project, PERMISSIONS.EDIT_SETTINGS) && { action: "edit", label: "Edit", Icon: EditOutlinedIcon },
    active && mayArchive && { action: "archive", label: "Archive", Icon: ArchiveOutlinedIcon },
    !active && mayArchive && { action: "restore", label: "Restore", Icon: UnarchiveOutlinedIcon },
    mayArchive && { action: "delete", label: "Delete", Icon: DeleteOutlinedIcon, danger: true },
  ].filter(Boolean);
};

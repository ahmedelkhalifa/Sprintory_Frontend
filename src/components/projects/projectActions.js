import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { can, isProjectArchived } from "../../utils/project";
import { PERMISSIONS } from "../../constants/projects";

// The project actions this user may use, by permission and status. Shared by the ⋮ menu in the
// projects list and the "Project settings" menu on the project page, so both always agree.
// ASSUMED endpoints until story 8 / R30; delete has no permission of its own yet, so it uses ARCHIVE_PROJECT
export const projectActionsFor = (project) => {
  const active = !isProjectArchived(project);
  const mayArchive = can(project, PERMISSIONS.ARCHIVE_PROJECT);
  return [
    active && can(project, PERMISSIONS.EDIT_SETTINGS) && { action: "edit", label: "Edit", Icon: EditOutlinedIcon },
    active && mayArchive && { action: "archive", label: "Archive", Icon: ArchiveOutlinedIcon },
    !active && mayArchive && { action: "restore", label: "Restore", Icon: UnarchiveOutlinedIcon },
    mayArchive && { action: "delete", label: "Delete", Icon: DeleteOutlinedIcon, danger: true },
  ].filter(Boolean);
};

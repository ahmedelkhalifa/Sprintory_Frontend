import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { projectActionsFor } from "../projectActions";
import { can } from "../../../utils/project";
import { PERMISSIONS } from "../../../constants/projects";

// The Settings tab's sections, in menu order; each id is its url segment (projectSettingsPath), General is the
// tab's own url. Hiding is only for usability: the backend refuses what the caller may not do anyway.
const SECTIONS = [
  { id: "general", label: "General", Icon: TuneOutlinedIcon },
  { id: "people", label: "People and access", Icon: GroupOutlinedIcon },
  { id: "board", label: "Board columns", Icon: ViewColumnOutlinedIcon },
  { id: "archive", label: "Archive or delete", Icon: Inventory2OutlinedIcon },
];

// the archive / restore / delete actions this caller has here; the menu's "edit" is the General section,
// and an archived workspace allows none of them
export const statusActionsFor = (project, workspaceArchived) =>
  workspaceArchived ? [] : projectActionsFor(project).filter(({ action }) => action !== "edit");

// the sections this caller sees: General and People for everyone who can open the project, Board columns with
// CONFIGURE_BOARD (also without an active sprint, or for an admin outside the project), Archive or delete when
// there is something to do there
export const settingsSectionsFor = (project, workspaceArchived) =>
  SECTIONS.filter(({ id }) => {
    if (id === "board") return can(project, PERMISSIONS.CONFIGURE_BOARD);
    if (id === "archive") return statusActionsFor(project, workspaceArchived).length > 0;
    return true;
  });

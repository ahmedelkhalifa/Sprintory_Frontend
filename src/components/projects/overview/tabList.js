import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

// The project page's tabs. `scrumOnly` tabs don't exist in Kanban projects (no backlog, no sprints).
// Each id is also the tab's url segment (projectTabPath); their routes are in App.jsx.
const TABS = [
  { id: "overview", label: "Overview", Icon: HomeOutlinedIcon },
  { id: "members", label: "Members", Icon: GroupOutlinedIcon },
  // members only (Viewers included): a workspace admin outside the project can't open its chat
  { id: "chat", label: "Chat", Icon: ChatBubbleOutlineIcon, membersOnly: true },
  { id: "backlog", label: "Backlog", Icon: ViewListOutlinedIcon, scrumOnly: true },
  { id: "board", label: "Board", Icon: ViewColumnOutlinedIcon },
  { id: "sprints", label: "Sprints", Icon: TimerOutlinedIcon, scrumOnly: true },
  { id: "reports", label: "Reports", Icon: BarChartOutlinedIcon },
  { id: "files", label: "Files", Icon: FolderOpenOutlinedIcon },
  { id: "settings", label: "Settings", Icon: SettingsOutlinedIcon },
];

// the tabs a project of this template has; `member` = the caller is in the project
export const tabsFor = (template, member = true) =>
  TABS.filter((tab) => (!tab.scrumOnly || template === "SCRUM") && (!tab.membersOnly || member));

export const tabLabel = (id) => TABS.find((tab) => tab.id === id)?.label ?? id;

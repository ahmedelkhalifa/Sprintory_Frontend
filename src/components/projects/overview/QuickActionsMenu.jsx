import { useState } from "react";
import { Button, Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

// "Quick actions" dropdown. Only "Invite members" works today; the others wait for their backend
// (tasks, sprints, files) and are shown greyed out. "Plan sprint" only exists in Scrum projects.
const QuickActionsMenu = ({ template, canInvite, onInvite }) => {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  const items = [
    { key: "task", label: "Create task", Icon: AddTaskOutlinedIcon },
    { key: "invite", label: "Invite members", Icon: PersonAddAlt1OutlinedIcon, enabled: canInvite, onClick: onInvite },
    template === "SCRUM" && { key: "sprint", label: "Plan sprint", Icon: EventNoteOutlinedIcon },
    { key: "file", label: "Upload file", Icon: UploadFileOutlinedIcon, dividerBefore: true },
  ].filter(Boolean);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<BoltOutlinedIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
      >
        Quick actions
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        {items.flatMap(({ key, label, Icon, enabled, onClick, dividerBefore }) => [
          dividerBefore && <Divider key={`${key}-divider`} />,
          <MenuItem
            key={key}
            disabled={!enabled}
            onClick={() => {
              close();
              onClick?.();
            }}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              secondary={enabled ? undefined : key === "invite" ? "Needs member permission" : "Coming soon"}
            />
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
};

export default QuickActionsMenu;

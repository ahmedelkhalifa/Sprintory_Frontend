import { useState } from "react";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { projectActionsFor } from "./projectActions";

// ⋮ button at the end of a project row: Edit, Archive / Restore, Delete.
// Shows nothing when the user may do none of them. Clicks never open the row underneath.
const ProjectActionsMenu = ({ project, onAction }) => {
  const [anchor, setAnchor] = useState(null);
  const items = projectActionsFor(project);
  if (items.length === 0) return null;

  const choose = (action) => {
    setAnchor(null);
    onAction(action, project);
  };

  return (
    // the menu renders in a portal, but React still bubbles its clicks to the row: stop them here
    <span onClick={(e) => e.stopPropagation()}>
      <IconButton size="small" aria-label={`Actions for ${project.name}`} onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 170 } } }}
      >
        {items.map(({ action, label, Icon, danger }) => (
          <MenuItem key={action} onClick={() => choose(action)} sx={danger ? { color: "error.main" } : undefined}>
            <ListItemIcon sx={danger ? { color: "error.main" } : undefined}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
};

export default ProjectActionsMenu;

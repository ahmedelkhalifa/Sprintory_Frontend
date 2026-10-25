import { useState } from "react";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { projectActionsFor } from "../projectActions";

// "Project settings" dropdown: Edit / Archive or Restore / Delete, with the same rules as the ⋮ menu
// in the projects list. Shows nothing when the user may do none of them.
const ProjectSettingsMenu = ({ project, onAction }) => {
  const [anchor, setAnchor] = useState(null);
  const items = projectActionsFor(project);
  if (items.length === 0) return null;

  const choose = (action) => {
    setAnchor(null);
    onAction(action);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<SettingsOutlinedIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={{ borderColor: "divider", bgcolor: "background.paper" }}
      >
        Project settings
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}
      >
        {items.map(({ action, label, Icon, danger }) => (
          <MenuItem key={action} onClick={() => choose(action)} sx={danger ? { color: "error.main" } : undefined}>
            <ListItemIcon sx={danger ? { color: "error.main" } : undefined}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label === "Edit" ? "Edit project" : label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ProjectSettingsMenu;

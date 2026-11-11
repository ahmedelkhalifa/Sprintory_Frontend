import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Button, Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

// "Project settings" dropdown: the caller's actions (Edit / Archive or Restore / Delete, from projectActionsFor,
// the same rules as the ⋮ menu in the projects list), then links to Settings → People and access and to all of
// Settings, which everyone who can open the project may read.
const ProjectSettingsMenu = ({ actions, onAction, peoplePath, settingsPath }) => {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  const choose = (action) => {
    close();
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
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        {actions.map(({ action, label, Icon, danger }) => (
          <MenuItem key={action} onClick={() => choose(action)} sx={danger ? { color: "error.main" } : undefined}>
            <ListItemIcon sx={danger ? { color: "error.main" } : undefined}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label === "Edit" ? "Edit project" : label}</ListItemText>
          </MenuItem>
        ))}
        {actions.length > 0 && <Divider />}
        <MenuItem component={RouterLink} to={peoplePath} onClick={close}>
          <ListItemIcon>
            <GroupOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>People and access</ListItemText>
        </MenuItem>
        <MenuItem component={RouterLink} to={settingsPath} onClick={close}>
          <ListItemIcon>
            <TuneOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>All settings</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProjectSettingsMenu;

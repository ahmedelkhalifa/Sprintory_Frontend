import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, ButtonBase, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { CheckRounded, UnfoldMoreRounded } from "@mui/icons-material";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { initials } from "../../utils/people";
import { ROLE_LABEL, workspacePath } from "../../utils/workspace";

const badgeSx = (size) => ({
  width: size,
  height: size,
  borderRadius: size > 30 ? 1.5 : 1,
  flexShrink: 0,
  bgcolor: "primary.main",
  color: "primary.contrastText",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: size > 30 ? 14 : 12,
});

// sidebar dropdown that shows the current workspace and switches to another one
const WorkspaceSwitcher = () => {
  const navigate = useNavigate();
  const { workspaces, current } = useWorkspaces();
  const [anchor, setAnchor] = useState(null);

  const go = (path) => {
    setAnchor(null);
    navigate(path);
  };

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={{
          width: "100%",
          p: 1,
          borderRadius: 2,
          textAlign: "left",
          justifyContent: "flex-start",
          gap: 1.5,
          color: "text.primary",
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
          transition: "border-color 0.15s",
          "&:hover, &[aria-expanded='true']": { borderColor: "primary.main" },
        }}
      >
        <Box sx={badgeSx(36)}>{current ? initials(current.name) : "?"}</Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {current ? current.name : "Select workspace"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.2 }}>
            {current ? ROLE_LABEL[current.role] : "Choose where to work"}
          </Typography>
        </Box>
        <UnfoldMoreRounded fontSize="small" sx={{ color: "text.secondary" }} />
      </ButtonBase>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
      >
        {workspaces.map((w) => (
          <MenuItem key={w.id} onClick={() => go(workspacePath(w))} sx={{ gap: 1.5 }}>
            <Box sx={badgeSx(28)}>{initials(w.name)}</Box>
            <Typography noWrap sx={{ flexGrow: 1 }}>{w.name}</Typography>
            {w.id === current?.id && <CheckRounded fontSize="small" color="primary" />}
          </MenuItem>
        ))}
        {workspaces.length > 0 && <Divider />}
        <MenuItem onClick={() => go("/workspaces")}>All workspaces</MenuItem>
      </Menu>
    </>
  );
};

export default WorkspaceSwitcher;

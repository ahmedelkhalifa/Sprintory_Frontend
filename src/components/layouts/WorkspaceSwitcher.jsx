import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, ButtonBase, Divider, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { CheckRounded, UnfoldMoreRounded } from "@mui/icons-material";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { initials } from "../../utils/people";
import { ROLE_LABEL, workspacePath } from "../../utils/workspace";
import { hoverTransition, pressable } from "../../theme/motion";

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

// sidebar dropdown that shows the current workspace and switches to another one.
// compact: the collapsed sidebar's version, only the badge (the name moves to a tooltip)
const WorkspaceSwitcher = ({ compact = false }) => {
  const navigate = useNavigate();
  const { workspaces, current } = useWorkspaces();
  const [anchor, setAnchor] = useState(null);
  const name = current ? current.name : "Select workspace";

  const go = (path) => {
    setAnchor(null);
    navigate(path);
  };

  return (
    <>
      <Tooltip title={compact ? name : ""} placement="right">
        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label={compact ? `Workspace: ${name}` : undefined}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          sx={{
            width: compact ? "auto" : "100%",
            p: compact ? 0.5 : 1,
            borderRadius: 2,
            textAlign: "left",
            justifyContent: "flex-start",
            gap: 1.5,
            color: "text.primary",
            // white on the gray sidebar
            bgcolor: compact ? "transparent" : "background.paper",
            border: 1,
            borderColor: compact ? "transparent" : "divider",
            ...pressable(0.98, hoverTransition("border-color")),
            "&:hover, &[aria-expanded='true']": { borderColor: "primary.main" },
          }}
        >
          <Box sx={badgeSx(compact ? 32 : 36)}>{current ? initials(current.name) : "?"}</Box>
          {!compact && (
            <>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.2 }}>
                  {current ? ROLE_LABEL[current.role] : "Choose where to work"}
                </Typography>
              </Box>
              <UnfoldMoreRounded fontSize="small" sx={{ color: "text.secondary" }} />
            </>
          )}
        </ButtonBase>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        // the rail's menu opens beside it instead of over the page edge
        anchorOrigin={compact ? { vertical: "top", horizontal: "right" } : undefined}
        slotProps={{ paper: { sx: { minWidth: 220, mt: compact ? 0 : 0.5, ml: compact ? 1 : 0 } } }}
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

import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
  AppBar, Avatar, Badge, Box, ButtonBase, Divider, Drawer, IconButton,
  InputAdornment, List, ListItemButton, ListItemIcon, ListItemText,
  Menu, MenuItem, TextField, Toolbar, Typography,
} from "@mui/material";
import {
  HomeOutlined, FolderOpenOutlined, ViewListOutlined, ViewColumnOutlined,
  TimerOutlined, BarChartOutlined, GroupOutlined, SettingsOutlined,
  SearchOutlined, NotificationsNoneOutlined, KeyboardArrowDown,
  LogoutOutlined, Menu as MenuIcon,
} from "@mui/icons-material";
import Logo from "../general/Logo";
import { useAuth } from "../../context/AuthContext";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { initials } from "../../utils/people";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const DRAWER_WIDTH = 270;
const HEADER_HEIGHT = 80;

const NAV_ITEMS = [
  { label: "Home", to: "/", icon: <HomeOutlined /> },
  { label: "Projects", to: "/projects", icon: <FolderOpenOutlined /> },
  { label: "Backlog", to: "/backlog", icon: <ViewListOutlined /> },
  { label: "Board", to: "/board", icon: <ViewColumnOutlined /> },
  { label: "Sprints", to: "/sprints", icon: <TimerOutlined /> },
  { label: "Reports", to: "/reports", icon: <BarChartOutlined /> },
  // workspace pages live under /workspaces/:id, see linkTo below
  { label: "Teams", workspacePath: "teams", icon: <GroupOutlined /> },
  { label: "Settings", to: "/settings", icon: <SettingsOutlined /> },
];

const paperSx = {
  width: DRAWER_WIDTH,
  boxSizing: "border-box",
  bgcolor: "primary.dark",
  color: "common.white",
  borderRight: 0,
};

// overrides the theme's light selected style, which is meant for light surfaces
const itemSx = (theme) => ({
  borderRadius: 2,
  py: 1.25,
  px: 2,
  color: alpha(theme.palette.common.white, 0.85),
  "&:hover": { bgcolor: alpha(theme.palette.common.white, 0.08) },
  "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "primary.main", color: "common.white" },
});

// the backend sends firstName/lastName, the dev fake user only has name
const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || user?.email || "";

// app layout for logged-in pages: dark sidebar + top bar, page content in <Outlet />
// desktop: permanent sidebar, mobile: sidebar opens from the menu button
const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentId } = useWorkspaces();
  const name = displayName(user);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    try {
      await logout();
    } catch {
      // the user is cleared anyway, nothing else to do
    }
    navigate("/login", { replace: true });
  };

  // exact match or a sub-page, so "/projects-x" doesn't highlight "/projects"
  const isSelected = (to) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  // without a current workspace, workspace pages send the user to pick one first
  const linkTo = (item) => {
    if (!item.workspacePath) return item.to;
    return currentId ? `/workspaces/${currentId}/${item.workspacePath}` : "/workspaces";
  };
  const isItemSelected = (item) =>
    item.workspacePath ? Boolean(currentId) && isSelected(linkTo(item)) : isSelected(item.to);

  const drawerContent = (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", px: 3, height: HEADER_HEIGHT }}>
        <Logo size={24} inverted />
      </Box>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography
          variant="caption"
          sx={(theme) => ({
            display: "block",
            px: 1,
            pb: 0.5,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: alpha(theme.palette.common.white, 0.55),
          })}
        >
          Workspaces
        </Typography>
        <WorkspaceSwitcher />
      </Box>
      <List sx={{ px: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.label}
            component={NavLink}
            to={linkTo(item)}
            selected={isItemSelected(item)}
            onClick={() => setMobileOpen(false)}
            sx={itemSx}
          >
            <ListItemIcon sx={{ minWidth: 44, color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: 500 } }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": paperSx }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": paperSx }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar sx={{ height: HEADER_HEIGHT, gap: 2 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>

            {/* TODO: wire up search once the backend has a search endpoint */}
            <TextField
              placeholder="Search projects, tasks, or people..."
              size="small"
              sx={{
                width: { xs: "100%", md: 480 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                  "& fieldset": { border: "none" },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <IconButton aria-label="Notifications">
              <Badge variant="dot" color="error">
                <NotificationsNoneOutlined />
              </Badge>
            </IconButton>

            <Divider orientation="vertical" flexItem sx={{ my: 2.5 }} />

            <ButtonBase
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={Boolean(userMenuAnchor)}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, borderRadius: 2, p: 0.5 }}
            >
              <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>{initials(name)}</Avatar>
              <Typography sx={{ fontWeight: 500, display: { xs: "none", sm: "block" } }}>
                {name}
              </Typography>
              <KeyboardArrowDown />
            </ButtonBase>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
                {user?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                )}
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutOutlined fontSize="small" />
                </ListItemIcon>
                Log out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;

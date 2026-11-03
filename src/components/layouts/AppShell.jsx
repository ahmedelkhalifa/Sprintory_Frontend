import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
  AppBar, Avatar, Box, ButtonBase, Divider, Drawer, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText,
  Menu, MenuItem, Toolbar, Typography,
} from "@mui/material";
import {
  HomeOutlined, FolderOpenOutlined, ViewListOutlined, ViewColumnOutlined,
  TimerOutlined, BarChartOutlined, GroupOutlined, SettingsOutlined,
  KeyboardArrowDown, LogoutOutlined, Menu as MenuIcon,
} from "@mui/icons-material";
import Logo from "../general/Logo";
import GlobalSearch from "../search/GlobalSearch";
import { useAuth } from "../../context/AuthContext";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { initials } from "../../utils/people";
import { workspacePath } from "../../utils/workspace";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import NotificationBell from "./NotificationBell";

const DRAWER_WIDTH = 256;
const HEADER_HEIGHT = 72;

const NAV_ITEMS = [
  { label: "Home", to: "/", icon: <HomeOutlined /> },
  { label: "Projects", workspacePath: "projects", icon: <FolderOpenOutlined /> },
  { label: "Backlog", to: "/backlog", icon: <ViewListOutlined /> },
  { label: "Board", to: "/board", icon: <ViewColumnOutlined /> },
  { label: "Sprints", to: "/sprints", icon: <TimerOutlined /> },
  { label: "Reports", to: "/reports", icon: <BarChartOutlined /> },
  { label: "Teams", workspacePath: "teams", icon: <GroupOutlined /> },
  { label: "Settings", to: "/settings", icon: <SettingsOutlined /> },
];

const paperSx = {
  width: DRAWER_WIDTH,
  boxSizing: "border-box",
  bgcolor: "background.paper",
  color: "text.primary",
  borderRight: 1,
  borderColor: "divider",
};

const itemSx = {
  borderRadius: 2,
  py: 1.25,
  px: 2,
  color: "text.secondary",
  "&.Mui-selected .MuiListItemText-primary": { fontWeight: 600 },
};

const onBar = (theme, opacity) => alpha(theme.palette.common.white, opacity);

const displayName = (user) =>
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || user?.email || "";

const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { current } = useWorkspaces();
  const name = displayName(user);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    try {
      await logout();
    } catch {
      // the user is cleared anyway
    }
    navigate("/login", { replace: true });
  };

  const isSelected = (to) =>
      to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  const linkTo = (item) => {
    if (!item.workspacePath) return item.to;
    return current ? `${workspacePath(current)}/${item.workspacePath}` : "/workspaces";
  };

  const isItemSelected = (item) =>
      item.workspacePath ? Boolean(current) && isSelected(linkTo(item)) : isSelected(item.to);

  const drawerContent = (header) => (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", px: 3, height: HEADER_HEIGHT }}>{header}</Box>
        <Box sx={{ px: 2, pt: 2, pb: 2 }}>
          <Typography
              variant="caption"
              sx={{
                display: "block",
                px: 1,
                pb: 0.5,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "text.secondary",
              }}
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
      <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.paper" }}>
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: "topBar.background", color: "common.white" }}>
          <Toolbar sx={{ height: HEADER_HEIGHT, gap: 2, pl: { md: 3 } }}>
            <IconButton
                onClick={() => setMobileOpen(true)}
                color="inherit"
                sx={{ display: { md: "none" } }}
                aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: { xs: "none", md: "flex" }, width: DRAWER_WIDTH - 24, flexShrink: 0 }}>
              <Logo size={24} inverted />
            </Box>

            <GlobalSearch />

            <Box sx={{ flexGrow: 1 }} />

            {/* Рабочий компонент колокольчика уведомлений */}
            <NotificationBell />

            <Divider
                orientation="vertical"
                flexItem
                sx={(theme) => ({ my: 2.25, borderColor: onBar(theme, 0.2) })}
            />

            <ButtonBase
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={Boolean(userMenuAnchor)}
                sx={{ display: "flex", alignItems: "center", gap: 1.5, borderRadius: 2, p: 0.5 }}
            >
              <Avatar
                  sx={(theme) => ({
                    bgcolor: "primary.main",
                    width: 40,
                    height: 40,
                    border: `2px solid ${onBar(theme, 0.25)}`,
                  })}
              >
                {initials(name)}
              </Avatar>
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

        <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
          <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": paperSx }}
          >
            {drawerContent(<Logo size={24} />)}
          </Drawer>

          <Drawer
              variant="permanent"
              open
              sx={{
                display: { xs: "none", md: "block" },
                "& .MuiDrawer-paper": { ...paperSx, zIndex: (theme) => theme.zIndex.appBar - 1 },
              }}
          >
            {drawerContent(null)}
          </Drawer>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ height: HEADER_HEIGHT, flexShrink: 0 }} />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
  );
};

export default AppShell;
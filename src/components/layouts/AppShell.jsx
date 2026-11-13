import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  AppBar, Avatar, Box, ButtonBase, Divider, Drawer, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText,
  Menu, MenuItem, Toolbar, Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import {
  HomeOutlined, FolderOpenOutlined, HistoryOutlined, GroupOutlined, SettingsOutlined,
  KeyboardArrowDown, LogoutOutlined, MenuRounded, MenuOpenRounded, ChatBubbleOutlineOutlined,
} from "@mui/icons-material";
import Logo from "../general/Logo";
import GlobalSearch from "../search/GlobalSearch";
import { useAuth } from "../../context/AuthContext";
import { useWorkspaces } from "../../context/WorkspaceContext";
import UndoDeleteProvider from "../../context/UndoDeleteProvider";
import { initials } from "../../utils/people";
import { isWorkspaceAdmin, workspacePath } from "../../utils/workspace";
import { HEADER_HEIGHT, SHELL_EASE, SIDEBAR_RAIL_WIDTH, SIDEBAR_WIDTH } from "../../theme/layout";
import { pressable } from "../../theme/motion";
import NotificationBell from "./NotificationBell";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const NAV_ID = "app-sidebar";
// the desktop sidebar's open / collapsed state survives reloads
const COLLAPSED_KEY = "sidebarCollapsed";

const NAV_ITEMS = [
  // the current workspace's overview, see linkTo below
  { label: "Home", home: true, icon: <HomeOutlined /> },
  // workspace pages live under /workspaces/:slug, see linkTo below
  { label: "Projects", workspacePath: "projects", icon: <FolderOpenOutlined /> },
  { label: "Chats", workspacePath: "chats", icon: <ChatBubbleOutlineOutlined /> },
  { label: "Teams", workspacePath: "teams", icon: <GroupOutlined /> },
  // only workspace admins may read the log; the backend refuses everyone else anyway
  { label: "Audit log", workspacePath: "audit-log", icon: <HistoryOutlined />, adminOnly: true },
  { label: "Settings", to: "/settings", icon: <SettingsOutlined /> },
];

// storage can be blocked (private mode, site data off): the sidebar then just starts open
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
};

const saveCollapsed = (value) => {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(value));
  } catch {
    // not remembered, nothing else to do
  }
};

// the sidebar's width change; reduced motion jumps straight to the new width
const widthMotion = {
  transition: `width 200ms ${SHELL_EASE}`,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
};

// labels stay in the page (so links keep their names) and fade out when the sidebar collapses
const fadeSx = (hidden) => ({ opacity: hidden ? 0 : 1, transition: "opacity 150ms ease" });

// the light-gray sidebar beside the white work surface
const paperSx = {
  boxSizing: "border-box",
  bgcolor: "background.default",
  color: "text.primary",
  borderRight: 1,
  borderColor: "divider",
  overflowX: "hidden",
};

// the selected colors come from the theme's MuiListItemButton override.
// list px 1 + item px 1.5 puts the icon's centre at 32px: the middle of the rail, so icons don't move
const itemSx = {
  borderRadius: 1,
  py: 0.75,
  px: 1.5,
  color: "text.secondary",
  whiteSpace: "nowrap",
  ...pressable(0.98, "background-color 120ms ease, color 120ms ease"),
  "&.Mui-selected .MuiListItemText-primary": { fontWeight: 600 },
};

// the backend sends firstName/lastName, the dev fake user only has name
const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || user?.email || "";

// app layout for logged-in pages: navy top bar + sidebar, page content in <Outlet />
// desktop: a permanent sidebar that collapses to an icon rail; mobile: it opens over the page from the menu button
const AppShell = () => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { current } = useWorkspaces();
  const name = displayName(user);
  const sidebarWidth = collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH;

  const toggleSidebar = () => {
    if (!desktop) {
      setMobileOpen(true);
      return;
    }
    setCollapsed((prev) => {
      saveCollapsed(!prev);
      return !prev;
    });
  };

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
  const isSelected = (to) => pathname === to || pathname.startsWith(`${to}/`);

  // the admin-only entries need a current workspace whose role says admin
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isWorkspaceAdmin(current));

  // without a current workspace, Home and the workspace pages send the user to pick one first
  const linkTo = (item) => {
    if (!item.home && !item.workspacePath) return item.to;
    if (!current) return "/workspaces";
    return item.home ? workspacePath(current) : `${workspacePath(current)}/${item.workspacePath}`;
  };
  const isItemSelected = (item) => {
    // Home is the overview itself only: every workspace page sits under it, and has its own entry or none
    if (item.home) return pathname === linkTo(item);
    return item.workspacePath ? Boolean(current) && isSelected(linkTo(item)) : isSelected(item.to);
  };

  // rail: the collapsed desktop sidebar (icons, tooltips, the workspace badge only)
  const drawerContent = (rail) => (
    <>
      <Box sx={{ px: rail ? 1.5 : 2, pt: 2, pb: 1.5 }}>
        {/* faded, not removed, so the list below doesn't jump up while the sidebar collapses */}
        <Typography
          variant="caption"
          aria-hidden={rail || undefined}
          sx={{
            display: "block",
            px: 1,
            pb: 0.5,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: "text.secondary",
            whiteSpace: "nowrap",
            ...fadeSx(rail),
          }}
        >
          Workspaces
        </Typography>
        <WorkspaceSwitcher compact={rail} />
      </Box>
      <List sx={{ px: 1, pt: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {navItems.map((item) => (
          <Tooltip key={item.label} title={rail ? item.label : ""} placement="right">
            <ListItemButton
              component={NavLink}
              to={linkTo(item)}
              // NavLink's own "active" would also match every page under the overview
              end={Boolean(item.home)}
              selected={isItemSelected(item)}
              onClick={() => setMobileOpen(false)}
              sx={itemSx}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: 500 } }} sx={fadeSx(rail)} />
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </>
  );

  return (
    // the white work surface; the sidebar beside it is the light gray (background.default)
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.paper" }}>
      {/* full-width white bar above the sidebar, a hairline under it; it keeps the default appBar z-index
          so slide-in drawers (team form, task details, mobile nav) still open over it */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ bgcolor: "topBar.background", color: "topBar.text", borderBottom: 1, borderColor: "divider" }}
      >
        {/* "&&" beats the Toolbar's own taller min-height on wider screens */}
        <Toolbar sx={{ height: HEADER_HEIGHT, "&&": { minHeight: HEADER_HEIGHT, pl: 1.5, pr: { xs: 1, sm: 2 } }, gap: 1.5 }}>
          {/* sits over the rail's icons, so the sidebar seems to fold into the button */}
          <IconButton
            onClick={toggleSidebar}
            color="inherit"
            aria-label={desktop ? (collapsed ? "Expand sidebar" : "Collapse sidebar") : "Open menu"}
            aria-controls={NAV_ID}
            aria-expanded={desktop ? !collapsed : mobileOpen}
          >
            {desktop && !collapsed ? <MenuOpenRounded /> : <MenuRounded />}
          </IconButton>

          <Box sx={{ display: { xs: "none", sm: "flex" }, mr: { sm: 1, md: 3 } }}>
            <Logo size={20} mark={false} />
          </Box>

          <GlobalSearch />

          <Box sx={{ flexGrow: 1 }} />

          <NotificationBell />

          <Divider orientation="vertical" flexItem sx={{ my: 1.75 }} />

          <ButtonBase
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={Boolean(userMenuAnchor)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderRadius: 1,
              p: 0.5,
              pr: 0.75,
              transition: "background-color 150ms ease",
              "&:hover, &[aria-expanded='true']": { bgcolor: "action.hover" },
            }}
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                width: 28,
                height: 28,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {initials(name)}
            </Avatar>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "text.primary", display: { xs: "none", sm: "block" } }}
            >
              {name}
            </Typography>
            <KeyboardArrowDown fontSize="small" />
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

      <Box
        component="nav"
        id={NAV_ID}
        aria-label="Main"
        sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 }, ...widthMotion }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { ...paperSx, width: SIDEBAR_WIDTH } }}
        >
          {/* opens over the top bar, so it shows the logo itself */}
          <Box sx={{ display: "flex", alignItems: "center", px: 3, height: HEADER_HEIGHT, flexShrink: 0 }}>
            <Logo size={20} mark={false} />
          </Box>
          {drawerContent(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              ...paperSx,
              ...widthMotion,
              width: sidebarWidth,
              // below the top bar, which covers its top HEADER_HEIGHT
              pt: `${HEADER_HEIGHT}px`,
              zIndex: (t) => t.zIndex.appBar - 1,
            },
          }}
        >
          {drawerContent(collapsed)}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* keeps the page out from under the fixed top bar */}
        <Box sx={{ height: HEADER_HEIGHT, flexShrink: 0 }} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {/* above the pages, so a task's Undo survives leaving the page it was deleted on */}
          <UndoDeleteProvider>
            <Outlet />
          </UndoDeleteProvider>
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;

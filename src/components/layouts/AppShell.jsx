import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
    AppBar, Avatar, Badge, Box, ButtonBase, Divider, Drawer, IconButton,
    InputAdornment, List, ListItemButton, ListItemIcon, ListItemText,
    TextField, Toolbar, Typography,
} from "@mui/material";
import {
    HomeOutlined, FolderOpenOutlined, ViewListOutlined, ViewColumnOutlined,
    TimerOutlined, BarChartOutlined, GroupOutlined, SettingsOutlined,
    SearchOutlined, NotificationsNoneOutlined, KeyboardArrowDown,
    Menu as MenuIcon, BoltOutlined,
} from "@mui/icons-material";

const DRAWER_WIDTH = 270;
const SIDEBAR_VARIANT = "dark"; // "dark" | "light"

const NAV_ITEMS = [
    { label: "Home", to: "/", icon: <HomeOutlined /> },
    { label: "Projects", to: "/projects", icon: <FolderOpenOutlined /> },
    { label: "Backlog", to: "/backlog", icon: <ViewListOutlined /> },
    { label: "Board", to: "/board", icon: <ViewColumnOutlined /> },
    { label: "Sprints", to: "/sprints", icon: <TimerOutlined /> },
    { label: "Reports", to: "/reports", icon: <BarChartOutlined /> },
    { label: "Teams", to: "/teams", icon: <GroupOutlined /> },
    { label: "Settings", to: "/settings", icon: <SettingsOutlined /> },
];

function AppShell() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { pathname } = useLocation();
    const dark = SIDEBAR_VARIANT === "dark";

    const isSelected = (to) =>
        to === "/" ? pathname === "/" : pathname.startsWith(to);

    const paperSx = {
        width: DRAWER_WIDTH,
        boxSizing: "border-box",
        bgcolor: dark ? "primary.dark" : "background.paper",
        color: dark ? "common.white" : "text.primary",
        borderRight: dark ? 0 : 1,
        borderColor: "divider",
    };

    const itemSx = (theme) => ({
        borderRadius: 2,
        py: 1.25,
        px: 2,
        color: dark ? alpha(theme.palette.common.white, 0.85) : "text.secondary",
        "&:hover": {
            bgcolor: dark ? alpha(theme.palette.common.white, 0.08) : "action.hover",
        },
        "&.Mui-selected": dark
            ? { bgcolor: "primary.main", color: "common.white" }
            : { bgcolor: "navActive.background", color: "navActive.text" },
        "&.Mui-selected:hover": {
            bgcolor: dark ? "primary.main" : "navActive.background",
        },
    });

    const drawerContent = (
        <Box>
            {/* TODO: REPLACE BY REAL LOGO */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 3, height: 80 }}>
                <BoltOutlined sx={{ fontSize: 32, color: dark ? "common.white" : "primary.main" }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Sprintory
                </Typography>
            </Box>
            <List sx={{ px: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {NAV_ITEMS.map((item) => (
                    <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        selected={isSelected(item.to)}
                        onClick={() => setMobileOpen(false)}
                        sx={itemSx}
                    >
                        <ListItemIcon sx={{ minWidth: 44, color: "inherit" }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: 500 } }} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
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
                    <Toolbar sx={{ height: 80, gap: 2 }}>
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            sx={{ display: { md: "none" } }}
                            aria-label="Open menu"
                        >
                            <MenuIcon />
                        </IconButton>

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

                        {/* TODO: имя и инициалы брать из AuthProvider, меню с Logout */}
                        <ButtonBase sx={{ display: "flex", alignItems: "center", gap: 1.5, borderRadius: 2, p: 0.5 }}>
                            <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>JD</Avatar>
                            <Typography sx={{ fontWeight: 500, display: { xs: "none", sm: "block" } }}>
                                John Doe
                            </Typography>
                            <KeyboardArrowDown />
                        </ButtonBase>
                    </Toolbar>
                </AppBar>

                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

export default AppShell;
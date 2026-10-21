import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, IconButton, Divider,
} from "@mui/material";
import {
    HomeOutlined, FolderOutlined, ViewKanbanOutlined,
    SettingsOutlined, Menu as MenuIcon,
} from "@mui/icons-material";

const DRAWER_WIDTH = 260;

// Пункты меню. Названия и адреса согласуй с командой.
const NAV_ITEMS = [
    { label: "Home", to: "/", icon: <HomeOutlined /> },
    { label: "Projects", to: "/projects", icon: <FolderOutlined /> },
    { label: "Board", to: "/board", icon: <ViewKanbanOutlined /> },
    { label: "Settings", to: "/settings", icon: <SettingsOutlined /> },
];

function AppShell() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { pathname } = useLocation();

    const isSelected = (to) =>
        to === "/" ? pathname === "/" : pathname.startsWith(to);

    const drawerContent = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, px: 3, py: 2.5 }}>
                Sprintory
            </Typography>
            <Divider />
            <List sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {NAV_ITEMS.map((item) => (
                    <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        selected={isSelected(item.to)}
                        onClick={() => setMobileOpen(false)}
                        sx={{ borderRadius: 1 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );

    const paperSx = {
        width: DRAWER_WIDTH,
        boxSizing: "border-box",
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                {/* Телефон/узкое окно: выезжающее меню */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": paperSx }}
                >
                    {drawerContent}
                </Drawer>
                {/* Широкий экран: сайдбар всегда на месте */}
                <Drawer
                    variant="permanent"
                    open
                    sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": paperSx }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: 3 }}>
                <IconButton
                    onClick={() => setMobileOpen(true)}
                    sx={{ display: { md: "none" }, mb: 2 }}
                    aria-label="Open menu"
                >
                    <MenuIcon />
                </IconButton>
                <Outlet />
            </Box>
        </Box>
    );
}

export default AppShell;
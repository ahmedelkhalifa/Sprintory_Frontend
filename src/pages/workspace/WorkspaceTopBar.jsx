import { AppBar, Avatar, Box, ButtonBase, Chip, IconButton, Toolbar, Typography } from "@mui/material";
import { KeyboardArrowDown, NotificationsNoneOutlined, WorkspacesOutlined } from "@mui/icons-material";

function WorkspaceTopBar() {
    return (
        <AppBar position="static" color="inherit" elevation={0}
                sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
            <Toolbar sx={{ gap: 2, minHeight: 60 }}>
                {/* TODO: Replace with logo */}
                <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 36, height: 36, fontWeight: 700 }}>S</Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Sprintory</Typography>

                <Box sx={{ flexGrow: 1 }} />

                <Chip icon={<WorkspacesOutlined />} label="Workspace preview" size="small"
                      sx={{ bgcolor: "background.default", color: "text.secondary" }} />
                <IconButton aria-label="Notifications"><NotificationsNoneOutlined /></IconButton>
                <ButtonBase sx={{ display: "flex", alignItems: "center", gap: 1, borderRadius: 2, p: 0.5 }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 14 }}>JD</Avatar>
                    <Typography sx={{ fontWeight: 500 }}>John Doe</Typography>
                    <KeyboardArrowDown fontSize="small" />
                </ButtonBase>
            </Toolbar>
        </AppBar>
    );
}

export default WorkspaceTopBar;
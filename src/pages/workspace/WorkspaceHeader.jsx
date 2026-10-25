import { Box, Button, Chip, Typography } from "@mui/material";
import { Add, PersonAddAltOutlined, SettingsOutlined } from "@mui/icons-material";

function WorkspaceHeader({ name, role, archived, isAdmin, onInvite, onSettings, onCreateProject }) {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { md: "flex-start" },
            gap: 2,
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{name}</Typography>
                <Chip label={role} size="small"
                      sx={{ bgcolor: "navActive.background", color: "navActive.text", fontWeight: 500 }} />
                {archived && <Chip label="Archived" size="small" color="warning" />}
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {isAdmin && !archived && (
                    <Button variant="outlined" startIcon={<PersonAddAltOutlined />} onClick={onInvite}>
                        Invite people
                    </Button>
                )}
                {isAdmin && (
                    <Button variant="outlined" color="inherit" startIcon={<SettingsOutlined />}
                            sx={{ borderColor: "divider" }} onClick={onSettings}>
                        Workspace settings
                    </Button>
                )}
                {!archived && (
                    <Button variant="contained" startIcon={<Add />} onClick={onCreateProject}>
                        Create project
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default WorkspaceHeader;
import { Box, Button, Chip, Typography } from "@mui/material";
import { Add, PersonAddAltOutlined, SettingsOutlined } from "@mui/icons-material";

function WorkspaceHeader({ name, role, description }) {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { md: "flex-start" },
            gap: 2,
        }}>
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{name}</Typography>
                    <Chip
                        label={role}
                        size="small"
                        sx={{ bgcolor: "navActive.background", color: "navActive.text", fontWeight: 500 }}
                    />
                </Box>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button variant="outlined" startIcon={<PersonAddAltOutlined />}>Invite people</Button>
                <Button variant="outlined" color="inherit" startIcon={<SettingsOutlined />} sx={{ borderColor: "divider" }}>
                    Workspace settings
                </Button>
                <Button variant="contained" startIcon={<Add />}>Create project</Button>
            </Box>
        </Box>
    );
}

export default WorkspaceHeader;
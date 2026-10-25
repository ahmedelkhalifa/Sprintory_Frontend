import { Box, Button, Chip, Typography } from "@mui/material";
import { Add, PersonAddAltOutlined, SettingsOutlined } from "@mui/icons-material";

// name, role and archived chips + the actions the caller's role allows
const WorkspaceHeader = ({ name, role, archived, isAdmin, onInvite, onSettings, onCreateProject }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { md: "flex-start" },
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>{name}</Typography>
        <Chip
          label={role}
          size="small"
          sx={{ bgcolor: "navActive.background", color: "navActive.text", fontWeight: 500 }}
        />
        {archived && <Chip label="Archived" size="small" color="warning" />}
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {isAdmin && !archived && (
          <Button variant="outlined" startIcon={<PersonAddAltOutlined />} onClick={onInvite}>
            Invite people
          </Button>
        )}
        {/* settings stay available when archived: that's where restore and delete are */}
        {isAdmin && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<SettingsOutlined />}
            sx={{ borderColor: "divider" }}
            onClick={onSettings}
          >
            Workspace settings
          </Button>
        )}
        {/* any member can create projects */}
        {!archived && (
          <Button variant="contained" startIcon={<Add />} onClick={onCreateProject}>
            Create project
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default WorkspaceHeader;

import { Avatar, Box, Button, Chip, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { EditOutlined, FolderOutlined, GroupsOutlined, AddRounded } from "@mui/icons-material";
import { demoMembers, demoProjects } from "./teamsDemoData";
import { PersonAvatar, TeamIcon } from "./TeamVisuals";

const memberById = new Map(demoMembers.map((member) => [member.id, member]));
const projectById = new Map(demoProjects.map((project) => [project.id, project]));

function SectionTitle({ children, action, onAction }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between",  mb: 1.5, gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>{children}</Typography>
      {action && <Button variant="text" size="small" startIcon={<AddRounded />} onClick={onAction}>{action}</Button>}
    </Stack>
  );
}

function MemberRows({ team }) {
  return (
    <List disablePadding>
      {team.members.map((id, index) => {
        const member = memberById.get(id);
        if (!member) return null;
        return (
          <ListItem key={id} divider={index !== team.members.length - 1} disableGutters sx={{ py: 1 }}>
            <ListItemAvatar sx={{ minWidth: 49 }}><PersonAvatar member={member} size={36} /></ListItemAvatar>
            <ListItemText
              primary={member.name}
              secondary={member.email}
              primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.77rem", sx: { overflowWrap: "anywhere" } }}
            />
          </ListItem>
        );
      })}
      {team.members.length === 0 && <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>No members assigned yet.</Typography>}
    </List>
  );
}

function ProjectRows({ team }) {
  return (
    <List disablePadding>
      {team.projects.map((id, index) => {
        const project = projectById.get(id);
        if (!project) return null;
        return (
          <ListItem key={id} disableGutters divider={index !== team.projects.length - 1} sx={{ py: 1.1 }}>
            <ListItemAvatar sx={{ minWidth: 48 }}>
              <Avatar variant="rounded" sx={(theme) => ({ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.main" })}>
                <FolderOutlined fontSize="small" />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={project.name}
              secondary={project.detail}
              primaryTypographyProps={{ fontWeight: 600, fontSize: "0.88rem" }}
              secondaryTypographyProps={{ fontSize: "0.77rem" }}
            />
            <Chip label={project.status} variant="outlined" size="small" sx={{ ml: 1, display: { xs: "none", sm: "inline-flex" }, color: "text.secondary", borderColor: "divider" }} />
          </ListItem>
        );
      })}
      {team.projects.length === 0 && <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>No projects assigned yet.</Typography>}
    </List>
  );
}

export default function TeamDetails({ team, tab, setTab, onEdit }) {
  if (!team) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2, border: 1, borderColor: "divider", textAlign: "center" }}>
        <GroupsOutlined sx={{ fontSize: 44, color: "primary.light", mb: 1 }} />
        <Typography variant="h6">Select a team</Typography>
        <Typography color="text.secondary" variant="body2">Choose a team on the left to see its members and projects.</Typography>
      </Paper>
    );
  }
  return (
    <Paper component="section" aria-label={`${team.name} details`} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "background.paper", minWidth: 0 }}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, alignItems: { xs: "flex-start", sm: "flex-start" }, justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ gap: 1.75,  minWidth: 0 }}>
          <TeamIcon name={team.name} size={56} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, overflowWrap: "anywhere" }}>{team.name}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, lineHeight: 1.55, overflowWrap: "anywhere" }}>{team.description || "No description yet."}</Typography>
          </Box>
        </Stack>
        <Button startIcon={<EditOutlined />} onClick={onEdit} variant="outlined" size="small" sx={{ flexShrink: 0 }}>Edit</Button>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Team details sections"
        sx={{ mt: 2.5, mb: 2.5, borderBottom: 1, borderColor: "divider", minHeight: 43, "& .MuiTab-root": { minHeight: 43 } }}
      >
        <Tab label="Overview" id="team-tab-0" aria-controls="team-panel-0" />
        <Tab label={`Members (${team.members.length})`} id="team-tab-1" aria-controls="team-panel-1" />
        <Tab label={`Projects (${team.projects.length})`} id="team-tab-2" aria-controls="team-panel-2" />
      </Tabs>

      <Box id={`team-panel-${tab}`} role="tabpanel" aria-labelledby={`team-tab-${tab}`}>
        {tab === 0 && (
          <>
            <Stack direction="row" sx={{ gap: 1.5,  mb: 3 }}>
              <Paper sx={{ flex: 1, py: 2, px: 1.5, borderRadius: 1.5, border: 1, borderColor: "divider", textAlign: "center" }}>
                <GroupsOutlined sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{team.members.length}</Typography>
                <Typography variant="caption" color="text.secondary">Members</Typography>
              </Paper>
              <Paper sx={{ flex: 1, py: 2, px: 1.5, borderRadius: 1.5, border: 1, borderColor: "divider", textAlign: "center" }}>
                <FolderOutlined sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{team.projects.length}</Typography>
                <Typography variant="caption" color="text.secondary">Projects</Typography>
              </Paper>
            </Stack>
            <SectionTitle action="Add members" onAction={onEdit}>Team members</SectionTitle>
            <MemberRows team={team} />
            <Box sx={{ mt: 3 }}>
              <SectionTitle action="Assign projects" onAction={onEdit}>Assigned projects</SectionTitle>
              <ProjectRows team={team} />
            </Box>
          </>
        )}
        {tab === 1 && <><SectionTitle action="Manage members" onAction={onEdit}>Team members</SectionTitle><MemberRows team={team} /></>}
        {tab === 2 && <><SectionTitle action="Assign projects" onAction={onEdit}>Assigned projects</SectionTitle><ProjectRows team={team} /></>}
      </Box>
    </Paper>
  );
}


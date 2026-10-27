import {
  Box, Button, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText,
  Paper, Stack, TextField, Typography,
} from "@mui/material";
import { AddRounded, DeleteOutlineRounded, EditOutlined, GroupsOutlined } from "@mui/icons-material";
import { memberLabel } from "../../utils/people";
import { PersonAvatar, TeamIcon } from "./TeamVisuals";

const panelSx = { borderRadius: 2, border: 1, borderColor: "divider" };

// selected team: name, member search and the paginated member list
const TeamDetails = ({
  team, membersPage, loading, memberQuery, onMemberQueryChange, onMore,
  canManage, onEdit, onAdd, onRemove,
}) => {
  if (!team) {
    return (
      <Paper sx={{ ...panelSx, p: 4, textAlign: "center" }}>
        <GroupsOutlined sx={{ fontSize: 42, color: "primary.light", mb: 1 }} />
        <Typography variant="h6">Select a team</Typography>
        <Typography variant="body2" color="text.secondary">Choose a team to view its members.</Typography>
      </Paper>
    );
  }

  const members = membersPage.content || [];
  const hasMore = membersPage.page + 1 < membersPage.totalPages;

  return (
    <Paper
      component="section"
      aria-label={`${team.name} details`}
      sx={{ ...panelSx, p: { xs: 2, sm: 3 }, bgcolor: "background.paper", minWidth: 0 }}
    >
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Stack direction="row" sx={{ minWidth: 0, gap: 1.5, alignItems: "center" }}>
          <TeamIcon name={team.name} size={49} />
          <Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{team.name}</Typography>
        </Stack>
        {canManage && (
          <Button variant="outlined" size="small" startIcon={<EditOutlined />} onClick={onEdit}>
            Rename
          </Button>
        )}
      </Stack>

      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Members ({membersPage.totalElements})</Typography>
        {canManage && <Button size="small" startIcon={<AddRounded />} onClick={onAdd}>Add members</Button>}
      </Stack>

      <TextField
        fullWidth
        size="small"
        label="Find team members"
        value={memberQuery}
        onChange={(e) => onMemberQueryChange(e.target.value)}
        sx={{ mb: 2 }}
      />
      {loading && (
        <Box sx={{ py: 2, textAlign: "center" }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <List disablePadding>
        {members.map((member) => (
          <ListItem
            key={member.userId}
            divider
            disableGutters
            sx={{ pr: canManage ? 5 : 0 }}
            secondaryAction={
              canManage && (
                <IconButton edge="end" aria-label={`Remove ${memberLabel(member)}`} onClick={() => onRemove(member)}>
                  <DeleteOutlineRounded />
                </IconButton>
              )
            }
          >
            <ListItemAvatar sx={{ minWidth: 47 }}>
              <PersonAvatar name={memberLabel(member)} size={34} />
            </ListItemAvatar>
            <ListItemText
              primary={memberLabel(member)}
              secondary={member.email}
              slotProps={{
                primary: { sx: { fontWeight: 650, overflowWrap: "anywhere" } },
                secondary: { sx: { overflowWrap: "anywhere" } },
              }}
            />
          </ListItem>
        ))}
      </List>
      {!loading && members.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No members found.</Typography>
      )}
      {hasMore && (
        <Button fullWidth disabled={loading} onClick={onMore} sx={{ mt: 1 }}>Load more members</Button>
      )}
    </Paper>
  );
};

export default TeamDetails;

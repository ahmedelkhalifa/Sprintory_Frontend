import { Box, Button, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import { AddRounded, DeleteOutlineRounded, EditOutlined, GroupsOutlined } from "@mui/icons-material";
import { PersonAvatar, TeamIcon } from "./TeamVisuals";
import { teamMemberLabel } from "./teamApiHelpers";

export default function TeamDetails({ team, membersPage, loading, memberQuery, setMemberQuery, onMore, canManage, onEdit, onAdd, onRemove }) {
  if (!team) return (
    <Paper sx={{ p: 4, borderRadius: 2, border: 1, borderColor: "divider", textAlign: "center" }}>
      <GroupsOutlined sx={{ fontSize: 42, color: "primary.light", mb: 1 }} />
      <Typography variant="h6">Select a team</Typography>
      <Typography variant="body2" color="text.secondary">Choose a team to view its members.</Typography>
    </Paper>
  );
  const members = membersPage.content || [];
  const hasMore = membersPage.page + 1 < membersPage.totalPages;
  return (
    <Paper component="section" aria-label={`${team.name} details`} sx={{ p: { xs: 2, sm: 3 }, bgcolor: "background.paper", borderRadius: 2, border: 1, borderColor: "divider", minWidth: 0 }}>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Stack direction="row" sx={{ minWidth: 0, gap: 1.5, alignItems: "center" }}>
          <TeamIcon name={team.name} size={49} />
          <Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{team.name}</Typography>
        </Stack>
        {canManage && <Button variant="outlined" size="small" startIcon={<EditOutlined />} onClick={onEdit}>Rename</Button>}
      </Stack>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" fontWeight={750}>Members ({membersPage.totalElements})</Typography>
        {canManage && <Button size="small" startIcon={<AddRounded />} onClick={onAdd}>Add members</Button>}
      </Stack>
      <TextField fullWidth size="small" label="Find team members" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} sx={{ mb: 2 }} />
      {loading && <Box sx={{ py: 2, textAlign: "center" }}><CircularProgress size={24} /></Box>}
      <List disablePadding>
        {members.map((member) => (
          <ListItem key={member.userId} divider disableGutters secondaryAction={canManage ? (
            <IconButton edge="end" aria-label={`Remove ${teamMemberLabel(member)}`} onClick={() => onRemove(member)}><DeleteOutlineRounded /></IconButton>
          ) : undefined} sx={{ pr: canManage ? 5 : 0 }}>
            <ListItemAvatar sx={{ minWidth: 47 }}><PersonAvatar member={{ name: teamMemberLabel(member) }} size={34} /></ListItemAvatar>
            <ListItemText primary={teamMemberLabel(member)} secondary={member.email} primaryTypographyProps={{ sx: { fontWeight: 650, overflowWrap: "anywhere" } }} secondaryTypographyProps={{ sx: { overflowWrap: "anywhere" } }} />
          </ListItem>
        ))}
      </List>
      {!loading && members.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No members found.</Typography>}
      {hasMore && <Button fullWidth disabled={loading} onClick={onMore} sx={{ mt: 1 }}>Load more members</Button>}
    </Paper>
  );
}

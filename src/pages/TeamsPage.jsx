import { useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Drawer, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Paper,
  Select, Snackbar, Stack, Tab, Tabs, TextField, Typography, useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AddRounded, CloseRounded, MailOutlineRounded, PersonAddAltOutlined,
  SearchRounded, WorkspacesOutlined,
} from "@mui/icons-material";
import { demoCurrentMemberId, demoTeams } from "./teams/teamsDemoData";
import { getVisibleTeams, isDuplicateInvitation, isDuplicateTeamName, removeTeamDraftInvitations } from "./teams/teamsPreviewLogic";
import TeamCard from "./teams/TeamCard";
import TeamDetails from "./teams/TeamDetails";
import TeamFormDrawer from "./teams/TeamFormDrawer";

const blankTeam = () => ({ name: "", description: "", members: [], projects: [] });

export default function TeamsPage() {
  const theme = useTheme();
  const compactLayout = useMediaQuery(theme.breakpoints.down("lg"));
  const [detailOpen, setDetailOpen] = useState(false);
  const [teams, setTeams] = useState(demoTeams);
  const [selectedId, setSelectedId] = useState(null);
  const [listTab, setListTab] = useState(0);
  const [detailTab, setDetailTab] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(blankTeam);
  const [deleteId, setDeleteId] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [invites, setInvites] = useState([]);
  const [notice, setNotice] = useState("");

  const visibleTeams = useMemo(
    () => getVisibleTeams(teams, { tab: listTab, search, sort, currentMemberId: demoCurrentMemberId }),
    [teams, listTab, search, sort],
  );
  const duplicateName = isDuplicateTeamName(teams, draft.name, editingId);

  const selectedTeam = visibleTeams.find((team) => team.id === selectedId) || (!compactLayout ? visibleTeams[0] : null);
  const editingTeam = teams.find((team) => team.id === editingId) || null;
  const deletionTarget = teams.find((team) => team.id === deleteId);

  const openCreate = () => { setDraft(blankTeam()); setEditingId(null); setFormOpen(true); };
  const openEdit = (team) => {
    setDraft({ name: team.name, description: team.description, members: [...team.members], projects: [...team.projects] });
    setEditingId(team.id);
    setFormOpen(true);
  };
  const saveTeam = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName || duplicateName) return;
    const value = { name: trimmedName, description: draft.description.trim(), members: draft.members, projects: draft.projects };
    if (editingId) {
      setTeams((current) => current.map((team) => team.id === editingId ? { ...team, ...value } : team));
      setSelectedId(editingId);
      setNotice("Team updated in this preview. Changes reset on refresh.");
    } else {
      const newTeam = { ...value, id: `team-${crypto.randomUUID()}` };
      setTeams((current) => [newTeam, ...current]);
      setSelectedId(newTeam.id);
      setListTab(0);
      setSearch("");
      setNotice("Team created in this preview. Changes reset on refresh.");
    }
    setDetailTab(0);
    setFormOpen(false);
  };
  const deleteTeam = () => {
    if (!deleteId) return;
    setTeams((current) => current.filter((team) => team.id !== deleteId));
    setInvites((current) => removeTeamDraftInvitations(current, deleteId));
    setSelectedId((current) => current === deleteId ? null : current);
    setDeleteId(null);
    setNotice("Team and related draft invitations removed from this preview.");
  };
  const openInvite = () => {
    setInviteEmail("");
    setInviteTeamId("");
    setInviteError("");
    setInviteOpen(true);
  };
  const closeInvite = () => { setInviteOpen(false); setInviteError(""); };
  const addInvite = (event) => {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (isDuplicateInvitation(invites, email, inviteTeamId)) {
      setInviteError("This email already has a draft invitation for that destination.");
      return;
    }
    setInvites((current) => [{ id: `invite-${crypto.randomUUID()}`, email, teamId: inviteTeamId }, ...current]);
    setInviteEmail("");
    setInviteTeamId("");
    closeInvite();
    setNotice("Invitation added to this preview. No email was sent.");
  };

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default", color: "text.primary" }}>
      <Box component="header" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, width: "100%", maxWidth: 1560, mx: "auto", px: { xs: 2, sm: 3, lg: 5 }, py: 1.75 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Avatar variant="rounded" sx={{ width: 33, height: 33, bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 800, borderRadius: 1 }}>S</Avatar>
            <Typography variant="h6" component="span" sx={{ fontWeight: 800, letterSpacing: "-0.04em" }}>Sprintory</Typography>
          </Stack>
          <Chip size="small" icon={<WorkspacesOutlined />} label="Workspace preview" sx={(theme) => ({ display: { xs: "none", sm: "inline-flex" }, bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.dark", "& .MuiChip-icon": { color: "primary.main" } })} />
        </Stack>
      </Box>

      <Box component="main" sx={{ minWidth: 0, width: "100%", maxWidth: 1560, mx: "auto", px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, md: 4.5 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 3.5, width: "100%" }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: "-0.04em", fontSize: { xs: "2rem", sm: "2.4rem" } }}>Teams</Typography>
            <Typography color="text.secondary" variant="body1" sx={{ mt: 0.7 }}>Organize people into teams and manage project access.</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Button variant="outlined" startIcon={<PersonAddAltOutlined />} onClick={openInvite}>Invite people</Button>
            <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate}>Create team</Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, gap: { xs: 2.75, sm: 2, md: 2 }, mb: { xs: 3.25, md: 2.5 }, width: "100%" }}>
          <Tabs value={listTab} onChange={(_, value) => setListTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Teams filters">
            <Tab label="All teams" />
            <Tab label="My teams" />
            <Tab label={`Invitations${invites.length ? ` (${invites.length})` : ""}`} />
          </Tabs>
          {listTab !== 2 && (
            <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: { xs: 2, sm: 1 }, minWidth: 0, flexShrink: 1 }}>
              <TextField
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams..."
                inputProps={{ "aria-label": "Search teams" }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: { sm: 200 }, width: { xs: "100%", sm: 240 } }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 155 } }}>
                <InputLabel id="teams-sort-label">Sort by</InputLabel>
                <Select labelId="teams-sort-label" label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="members">Most members</MenuItem>
                  <MenuItem value="projects">Most projects</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </Stack>

        {listTab === 2 ? (
          <Paper sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 2, sm: 3 }, maxWidth: 850 }}>
            <Typography variant="h6" fontWeight={750} sx={{ mb: 0.5 }}>Invitations</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Preview invitations created in this browser session. No emails are sent.</Typography>
            {invites.length ? invites.map((invite) => (
              <Stack key={invite.id} direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1,  py: 1.5, borderTop: 1, borderColor: "divider" }}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
                  <MailOutlineRounded color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight={650}>{invite.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{teams.find((team) => team.id === invite.teamId)?.name || "Workspace"}</Typography>
                  </Box>
                </Stack>
                <Chip size="small" label="Draft · not sent" variant="outlined" />
              </Stack>
            )) : <Box sx={{ textAlign: "center", py: 5 }}><MailOutlineRounded sx={{ fontSize: 40, color: "primary.light" }} /><Typography sx={{ mt: 1 }} fontWeight={650}>No invitations in this preview</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Use “Invite people” to try the invitation form.</Typography></Box>}
          </Paper>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.05fr) minmax(0, 0.95fr)" }, alignItems: "start", gap: 2.5 }}>
            <Box component="section" aria-label="Teams list" sx={{ minWidth: 0 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center",  mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">{visibleTeams.length} {visibleTeams.length === 1 ? "team" : "teams"}</Typography>
              </Stack>
              <Stack sx={{ gap: 1.4 }}>
                {visibleTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    selected={selectedTeam?.id === team.id}
                    onSelect={() => { setSelectedId(team.id); setDetailTab(0); if (compactLayout) setDetailOpen(true); }}
                    onEdit={() => openEdit(team)}
                    onDelete={() => setDeleteId(team.id)}
                  />
                ))}
                {!visibleTeams.length && (
                  <Paper sx={{ p: 4, border: 1, borderColor: "divider", borderRadius: 2, textAlign: "center" }}>
                    <SearchRounded sx={{ color: "primary.light", fontSize: 38 }} />
                    <Typography fontWeight={750} sx={{ mt: 1 }}>No matching teams</Typography>
                    <Typography color="text.secondary" variant="body2">Try another search or switch to All teams.</Typography>
                  </Paper>
                )}
              </Stack>
            </Box>
            <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 0, pt: 3.75 }}>
              <TeamDetails team={selectedTeam} tab={detailTab} setTab={setDetailTab} onEdit={() => selectedTeam && openEdit(selectedTeam)} />
            </Box>
          </Box>
        )}
      </Box>

      {compactLayout && (
        <Drawer
          anchor="right"
          open={detailOpen && listTab !== 2}
          onClose={() => setDetailOpen(false)}
          PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, maxWidth: "100vw", bgcolor: "background.default" } }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center",  px: 1, pb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={750}>Team details</Typography>
              <IconButton onClick={() => setDetailOpen(false)} aria-label="Close team details"><CloseRounded /></IconButton>
            </Stack>
            <TeamDetails team={selectedTeam} tab={detailTab} setTab={setDetailTab} onEdit={() => { setDetailOpen(false); if (selectedTeam) openEdit(selectedTeam); }} />
          </Box>
        </Drawer>
      )}
      <TeamFormDrawer key={`${formOpen ? "open" : "closed"}-${editingId || "new"}`} open={formOpen} team={editingTeam} draft={draft} setDraft={setDraft} duplicateName={duplicateName} onClose={() => setFormOpen(false)} onSave={saveTeam} />
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete team?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Remove “{deletionTarget?.name}” from this preview? This change is not saved to a server.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setDeleteId(null)}>Cancel</Button><Button onClick={deleteTeam} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>
      <Dialog open={inviteOpen} onClose={closeInvite} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={addInvite}>
          <DialogTitle>Invite people</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Try the invitation form with sample data. No email will be sent.</Typography>
            <Stack spacing={2}>
              <TextField type="email" required fullWidth label="Email address" placeholder="teammate@example.com" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); setInviteError(""); }} error={Boolean(inviteError)} helperText={inviteError || " "} />
              <FormControl fullWidth>
                <InputLabel id="invite-team-label">Team (optional)</InputLabel>
                <Select labelId="invite-team-label" label="Team (optional)" value={inviteTeamId} onChange={(event) => { setInviteTeamId(event.target.value); setInviteError(""); }}>
                  <MenuItem value="">Workspace only</MenuItem>
                  {teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={closeInvite}>Cancel</Button><Button type="submit" variant="contained" startIcon={<PersonAddAltOutlined />}>Add preview invitation</Button></DialogActions>
        </Box>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setNotice("")} severity="info" variant="filled" sx={{ width: "100%" }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}

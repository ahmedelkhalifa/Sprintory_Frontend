import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Drawer, IconButton, Paper, Snackbar, Stack, TextField, Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AddRounded, CloseRounded, SearchRounded } from "@mui/icons-material";
import {
  addTeamMembers, createTeam, deleteTeam, getTeam, getWorkspace,
  listTeamMembers, listTeams, removeTeamMember, renameTeam,
} from "../api/teamsApi";
import { emptyPage, errorMessage, isAbort, isWorkspaceAdmin, isWorkspaceArchived, parseWorkspaceId, teamMemberLabel } from "./teams/teamApiHelpers";
import TeamCard from "./teams/TeamCard";
import TeamDetails from "./teams/TeamDetails";
import TeamFormDrawer from "./teams/TeamFormDrawer";
import TeamMemberDrawer from "./teams/TeamMemberDrawer";

export default function TeamsPage() {
  const { workspaceId: routeWorkspaceId } = useParams();
  const [params] = useSearchParams();
  // Remount local state when the workspace changes to avoid showing another workspace's data.
  const workspaceId = parseWorkspaceId(routeWorkspaceId ?? params.get("workspaceId"));
  return <WorkspaceTeams key={workspaceId ?? "no-workspace"} workspaceId={workspaceId} />;
}

function WorkspaceTeams({ workspaceId }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("lg"));

  const [workspaceResult, setWorkspaceResult] = useState({ id: null, data: null, error: "" });
  const workspace = workspaceResult.id === workspaceId ? workspaceResult.data : null;
  const workspaceError = workspaceResult.id === workspaceId ? workspaceResult.error : "";
  const loadingWorkspace = Boolean(workspaceId && workspaceResult.id !== workspaceId);
  const [teamsResult, setTeamsResult] = useState({ key: "", data: emptyPage, error: "" });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [reloadTeams, setReloadTeams] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailResult, setDetailResult] = useState({ teamId: null, data: null });
  const [memberResult, setMemberResult] = useState({ key: "", index: -1, data: emptyPage, error: "" });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberIndex, setMemberIndex] = useState(0);
  const [memberReload, setMemberReload] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formTeam, setFormTeam] = useState(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => { const timeout = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300); return () => clearTimeout(timeout); }, [search]);
  useEffect(() => { const timeout = setTimeout(() => { setMemberQuery(memberSearch.trim()); setMemberIndex(0); }, 300); return () => clearTimeout(timeout); }, [memberSearch]);
  useEffect(() => {
    if (!workspaceId) return undefined;
    const controller = new AbortController();
    getWorkspace(workspaceId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setWorkspaceResult({ id: workspaceId, data, error: "" }); })
      .catch((error) => { if (!isAbort(error) && !controller.signal.aborted) setWorkspaceResult({ id: workspaceId, data: null, error: errorMessage(error, "Unable to load the workspace.") }); });
    return () => controller.abort();
  }, [workspaceId]);

  const listKey = JSON.stringify([workspaceId, query, page, reloadTeams]);
  const pageData = teamsResult.key === listKey ? teamsResult.data : emptyPage;
  const listError = teamsResult.key === listKey ? teamsResult.error : "";
  const loadingTeams = Boolean(workspace && teamsResult.key !== listKey);

  useEffect(() => {
    if (!workspaceId || !workspace) return undefined;
    const controller = new AbortController();
    listTeams(workspaceId, { q: query, page, size: 20 }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setTeamsResult({ key: listKey, data, error: "" }); })
      .catch((error) => { if (!isAbort(error) && !controller.signal.aborted) setTeamsResult({ key: listKey, data: emptyPage, error: errorMessage(error, "Unable to load teams.") }); });
    return () => controller.abort();
  }, [workspaceId, workspace, query, page, reloadTeams, listKey]);

  const teams = pageData.content || [];
  // Desktop defaults to the first visible team; mobile waits for an explicit tap.
  const activeId = teams.some((team) => team.id === selectedId) ? selectedId : compact ? null : teams[0]?.id;
  const admin = isWorkspaceAdmin(workspace);
  const canManage = admin && !isWorkspaceArchived(workspace);

  const detail = detailResult.teamId === activeId ? detailResult.data : null;
  const memberKey = JSON.stringify([activeId, memberQuery, memberReload]);
  const memberPage = memberResult.key === memberKey ? memberResult.data : emptyPage;
  const membersLoading = Boolean(activeId && (memberResult.key !== memberKey || memberResult.index !== memberIndex));

  const selectTeam = (id, openDrawer = false) => {
    setSelectedId(id);
    setDetailOpen(openDrawer);
    setMemberSearch("");
    setMemberQuery("");
    setMemberIndex(0);
  };

  useEffect(() => {
    if (!activeId) return undefined;
    const controller = new AbortController();
    getTeam(activeId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setDetailResult({ teamId: activeId, data }); })
      .catch((error) => { if (!isAbort(error) && !controller.signal.aborted) { setActionError(errorMessage(error, "Unable to load team details.")); setDetailOpen(false); setReloadTeams((n) => n + 1); } });
    return () => controller.abort();
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return undefined;
    const controller = new AbortController();
    listTeamMembers(activeId, { q: memberQuery, page: memberIndex, size: 20 }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setMemberResult((previous) => ({
          key: memberKey,
          index: memberIndex,
          error: "",
          data: {
            ...result,
            content: memberIndex > 0 && previous.key === memberKey
              ? [...previous.data.content, ...result.content]
              : result.content,
          },
        }));
      })
      .catch((error) => { if (!isAbort(error) && !controller.signal.aborted) setActionError(errorMessage(error, "Unable to load team members.")); });
    return () => controller.abort();
  }, [activeId, memberQuery, memberIndex, memberReload, memberKey]);

  const openForm = (team = null) => { if (!canManage) return; setFormTeam(team); setFormError(""); setFormOpen(true); };
  const saveTeam = async (name) => {
    setBusy(true); setFormError("");
    try {
      const saved = formTeam ? await renameTeam(formTeam.id, name) : await createTeam(workspaceId, name);
      setFormOpen(false); setNotice(formTeam ? "Team renamed." : "Team created.");
      // Clear search because a newly created or renamed team may not match it.
      setSearch(""); setQuery(""); setPage(0); selectTeam(saved.id);
      setReloadTeams((n) => n + 1);
    } catch (error) { setFormError(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteTeam(deleteTarget.id);
      if (deleteTarget.id === activeId) selectTeam(null);
      setDeleteTarget(null); setReloadTeams((n) => n + 1); setNotice("Team deleted. Workspace and project access are unchanged.");
    } catch (error) { setActionError(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const addMembers = async (userIds) => {
    setBusy(true);
    try {
      await addTeamMembers(activeId, userIds);
      setMemberDrawerOpen(false); setMemberIndex(0); setMemberReload((n) => n + 1);
      setNotice("Team members updated.");
    } catch (error) { setActionError(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const confirmRemove = async () => {
    setBusy(true);
    try {
      await removeTeamMember(activeId, removeTarget.userId);
      setRemoveTarget(null); setMemberIndex(0); setMemberReload((n) => n + 1);
      setNotice("Member removed from the team. Workspace and project access are unchanged.");
    } catch (error) { setActionError(errorMessage(error)); }
    finally { setBusy(false); }
  };

  const details = (
    <TeamDetails team={detail?.id === activeId ? detail : null} membersPage={memberPage} loading={membersLoading}
      memberQuery={memberSearch} setMemberQuery={(value) => { setMemberSearch(value); setMemberIndex(0); }} onMore={() => setMemberIndex((n) => n + 1)}
      canManage={canManage} onEdit={() => openForm(detail)} onAdd={() => setMemberDrawerOpen(true)} onRemove={setRemoveTarget} />
  );

  return (
    <Box component="main" sx={{ minWidth: 0, width: "100%", maxWidth: 1550, mx: "auto", px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, md: 4.5 }, bgcolor: "background.default" }}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 3.5 }}>
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.04em" }}>Teams</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Manage teams and workspace members.</Typography>
          {workspace?.name && <Typography variant="caption" color="text.secondary">Workspace: {workspace.name}</Typography>}
        </Box>
        {canManage && <Button variant="contained" startIcon={<AddRounded />} onClick={() => openForm()}>Create team</Button>}
      </Stack>
      {!workspaceId && (
        <Alert severity="info">Select a workspace to manage its teams. Open <strong>/workspaces/&#123;workspaceId&#125;/teams</strong> or provide <strong>?workspaceId=</strong> in this URL.</Alert>
      )}
      {loadingWorkspace && <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>}
      {workspaceError && <Alert severity="error">{workspaceError}</Alert>}
      {workspace && isWorkspaceArchived(workspace) && <Alert severity="info" sx={{ mb: 2 }}>This workspace is archived. Teams are read-only.</Alert>}
      {workspace && (
        <>
          <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: { xs: 2.5, md: 2 }, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, mb: { xs: 3, md: 2.5 } }}>
            <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 750 }}>TEAMS</Typography>
            <TextField size="small" label="Search teams" value={search} onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: "100%", md: 290 } }} InputProps={{ startAdornment: <SearchRounded color="action" fontSize="small" sx={{ mr: 1 }} /> }} />
          </Stack>
          {listError && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setReloadTeams((n) => n + 1)}>Retry</Button>}>{listError}</Alert>}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.05fr) minmax(0, 0.95fr)" }, gap: 2.5, alignItems: "start" }}>
            <Box component="section" aria-label="Teams list" sx={{ minWidth: 0 }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">{pageData.totalElements} {pageData.totalElements === 1 ? "team" : "teams"}</Typography>
                {loadingTeams && <CircularProgress size={20} />}
              </Stack>
              <Stack sx={{ gap: 1.4 }}>
                {teams.map((team) => <TeamCard key={team.id} team={team} selected={activeId === team.id}
                  canManage={canManage} onSelect={() => selectTeam(team.id, compact)}
                  onEdit={() => openForm(team)} onDelete={() => setDeleteTarget(team)} />)}
                {!loadingTeams && !teams.length && <Paper sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}><Typography fontWeight={700}>No teams found</Typography><Typography variant="body2" color="text.secondary">{admin ? "Create the first team, or try a different search." : "You are not a member of any matching team."}</Typography></Paper>}
              </Stack>
              {pageData.totalPages > 1 && <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", justifyContent: "center", mt: 2 }}>
                <Button disabled={page <= 0 || loadingTeams} onClick={() => { setPage((n) => n - 1); selectTeam(null); }}>Previous</Button>
                <Typography variant="caption">Page {pageData.page + 1} of {pageData.totalPages}</Typography>
                <Button disabled={page + 1 >= pageData.totalPages || loadingTeams} onClick={() => { setPage((n) => n + 1); selectTeam(null); }}>Next</Button>
              </Stack>}
            </Box>
            <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 0, pt: 3.75 }}>{details}</Box>
          </Box>
        </>
      )}
      {compact && <Drawer anchor="right" open={detailOpen && Boolean(activeId)} onClose={() => setDetailOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, maxWidth: "100vw", bgcolor: "background.default" } }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: 1, pb: 1.5 }}>
            <Typography fontWeight={750}>Team details</Typography>
            <IconButton onClick={() => setDetailOpen(false)} aria-label="Close team details"><CloseRounded /></IconButton>
          </Stack>
          {details}
        </Box>
      </Drawer>}
      {formOpen && <TeamFormDrawer open team={formTeam} busy={busy} error={formError} onClose={() => setFormOpen(false)} onSave={saveTeam} />}
      {memberDrawerOpen && Boolean(activeId) && (
        <TeamMemberDrawer open workspaceId={workspaceId} currentMembers={memberPage.content} busy={busy}
          onClose={() => setMemberDrawerOpen(false)} onAdd={addMembers} />
      )}
      <Dialog open={Boolean(deleteTarget)} onClose={busy ? undefined : () => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete team?</DialogTitle>
        <DialogContent><Typography variant="body2">Delete “{deleteTarget?.name}”? This cannot be undone. Workspace members and their project access will remain unchanged.</Typography></DialogContent>
        <DialogActions><Button disabled={busy} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button disabled={busy} color="error" variant="contained" onClick={confirmDelete}>Delete</Button></DialogActions>
      </Dialog>
      <Dialog open={Boolean(removeTarget)} onClose={busy ? undefined : () => setRemoveTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Remove team member?</DialogTitle>
        <DialogContent><Typography variant="body2">Remove {removeTarget && teamMemberLabel(removeTarget)} from this team? Their workspace and project access will stay unchanged.</Typography></DialogContent>
        <DialogActions><Button disabled={busy} onClick={() => setRemoveTarget(null)}>Cancel</Button><Button disabled={busy} color="error" onClick={confirmRemove}>Remove</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice || actionError)} autoHideDuration={5000} onClose={() => { setNotice(""); setActionError(""); }} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={actionError ? "error" : "success"} variant="filled" onClose={() => { setNotice(""); setActionError(""); }}>{actionError || notice}</Alert>
      </Snackbar>
    </Box>
  );
}

import { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Drawer, IconButton, InputAdornment, Paper, Snackbar, Stack, TextField, Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AddRounded, CloseRounded, SearchRounded } from "@mui/icons-material";
import {
  addTeamMembers, createTeam, deleteTeam, getTeam, listTeamMembers, listTeams, removeTeamMember, renameTeam,
} from "../../api/teamsApi";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { errorMessage, isAbort } from "../../utils/apiError";
import { EMPTY_PAGE } from "../../utils/page";
import { memberLabel } from "../../utils/people";
import { isWorkspaceAdmin, isWorkspaceArchived } from "../../utils/workspace";
import TeamCard from "../../components/teams/TeamCard";
import TeamDetails from "../../components/teams/TeamDetails";
import TeamFormDrawer from "../../components/teams/TeamFormDrawer";
import TeamMemberDrawer from "../../components/teams/TeamMemberDrawer";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

// /workspaces/:workspaceId/teams: WorkspaceAccessGuard has loaded the workspace
// (and remounts this page when the workspace changes, so another workspace's data is never shown)
const TeamsPage = () => {
  const { workspace } = useWorkspaceAccess();
  const workspaceId = workspace.id;
  const theme = useTheme();
  // below lg the details open in a drawer instead of a side column
  const compact = useMediaQuery(theme.breakpoints.down("lg"));

  // Loaded data is stored together with the request it answers (key).
  // A result whose key doesn't match the current request is treated as "still loading",
  // so there is no setState inside effects and a slow, stale response is never shown.
  const [teamsResult, setTeamsResult] = useState({ key: "", data: EMPTY_PAGE, error: "" });
  const [detailResult, setDetailResult] = useState({ teamId: null, data: null });
  const [memberResult, setMemberResult] = useState({ key: "", index: -1, data: EMPTY_PAGE });

  // teams list
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [reloadTeams, setReloadTeams] = useState(0);

  // selected team + its members
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberIndex, setMemberIndex] = useState(0);
  const [memberReload, setMemberReload] = useState(0);

  // dialogs and drawers
  const [formOpen, setFormOpen] = useState(false);
  const [formTeam, setFormTeam] = useState(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  // only search once the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMemberQuery(memberSearch.trim());
      setMemberIndex(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  const listKey = JSON.stringify([workspaceId, query, page, reloadTeams]);
  const pageData = teamsResult.key === listKey ? teamsResult.data : EMPTY_PAGE;
  const listError = teamsResult.key === listKey ? teamsResult.error : "";
  const loadingTeams = teamsResult.key !== listKey;

  useEffect(() => {
    const controller = new AbortController();
    listTeams(workspaceId, { q: query, page, size: PAGE_SIZE }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setTeamsResult({ key: listKey, data, error: "" });
      })
      .catch((err) => {
        if (isAbort(err) || controller.signal.aborted) return;
        setTeamsResult({ key: listKey, data: EMPTY_PAGE, error: errorMessage(err, "Unable to load teams.") });
      });
    return () => controller.abort();
  }, [workspaceId, query, page, reloadTeams, listKey]);

  const teams = pageData.content || [];
  // desktop defaults to the first visible team; mobile waits for an explicit tap
  const activeId = teams.some((team) => team.id === selectedId) ? selectedId : compact ? null : teams[0]?.id;
  const admin = isWorkspaceAdmin(workspace);
  const canManage = admin && !isWorkspaceArchived(workspace);

  const detail = detailResult.teamId === activeId ? detailResult.data : null;
  const memberKey = JSON.stringify([activeId, memberQuery, memberReload]);
  const memberPage = memberResult.key === memberKey ? memberResult.data : EMPTY_PAGE;
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
      .then((data) => {
        if (!controller.signal.aborted) setDetailResult({ teamId: activeId, data });
      })
      .catch((err) => {
        if (isAbort(err) || controller.signal.aborted) return;
        // the team was probably deleted meanwhile: say so and refresh the list
        setActionError(errorMessage(err, "Unable to load team details."));
        setDetailOpen(false);
        setReloadTeams((n) => n + 1);
      });
    return () => controller.abort();
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return undefined;
    const controller = new AbortController();
    listTeamMembers(activeId, { q: memberQuery, page: memberIndex, size: PAGE_SIZE }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setMemberResult((previous) => ({
          key: memberKey,
          index: memberIndex,
          data: {
            ...data,
            // "load more" appends to the pages already shown for the same search
            content: memberIndex > 0 && previous.key === memberKey
              ? [...previous.data.content, ...data.content]
              : data.content,
          },
        }));
      })
      .catch((err) => {
        if (!isAbort(err) && !controller.signal.aborted) setActionError(errorMessage(err, "Unable to load team members."));
      });
    return () => controller.abort();
  }, [activeId, memberQuery, memberIndex, memberReload, memberKey]);

  const reloadMembers = () => {
    setMemberIndex(0);
    setMemberReload((n) => n + 1);
  };

  // runs a write action with the shared busy flag; errors go to the snackbar
  const runAction = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openForm = (team = null) => {
    if (!canManage) return;
    setFormTeam(team);
    setFormError("");
    setFormOpen(true);
  };

  const saveTeam = async (name) => {
    setBusy(true);
    setFormError("");
    try {
      const saved = formTeam ? await renameTeam(formTeam.id, name) : await createTeam(workspaceId, name);
      setFormOpen(false);
      setNotice(formTeam ? "Team renamed." : "Team created.");
      // clear the search, the saved team may not match it
      setSearch("");
      setQuery("");
      setPage(0);
      selectTeam(saved.id);
      setReloadTeams((n) => n + 1);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () =>
    runAction(async () => {
      await deleteTeam(deleteTarget.id);
      if (deleteTarget.id === activeId) selectTeam(null);
      setDeleteTarget(null);
      setReloadTeams((n) => n + 1);
      setNotice("Team deleted. Workspace and project access are unchanged.");
    });

  const addMembers = (userIds) =>
    runAction(async () => {
      await addTeamMembers(activeId, userIds);
      setMemberDrawerOpen(false);
      reloadMembers();
      setNotice("Team members updated.");
    });

  const confirmRemove = () =>
    runAction(async () => {
      await removeTeamMember(activeId, removeTarget.userId);
      setRemoveTarget(null);
      reloadMembers();
      setNotice("Member removed from the team. Workspace and project access are unchanged.");
    });

  const goToPage = (next) => {
    setPage(next);
    selectTeam(null);
  };

  const closeSnackbar = () => {
    setNotice("");
    setActionError("");
  };

  const details = (
    <TeamDetails
      team={detail?.id === activeId ? detail : null}
      membersPage={memberPage}
      loading={membersLoading}
      memberQuery={memberSearch}
      onMemberQueryChange={(value) => {
        setMemberSearch(value);
        setMemberIndex(0);
      }}
      onMore={() => setMemberIndex((n) => n + 1)}
      canManage={canManage}
      onEdit={() => openForm(detail)}
      onAdd={() => setMemberDrawerOpen(true)}
      onRemove={setRemoveTarget}
    />
  );

  return (
    <Box sx={{ minWidth: 0, maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 3.5 }}
      >
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.04em" }}>Teams</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Manage teams and workspace members.</Typography>
          <Typography variant="caption" color="text.secondary">Workspace: {workspace.name}</Typography>
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openForm()}>Create team</Button>
        )}
      </Stack>

      {isWorkspaceArchived(workspace) && (
        <Alert severity="info" sx={{ mb: 2 }}>This workspace is archived. Teams are read-only.</Alert>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          gap: { xs: 2.5, md: 2 },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          mb: { xs: 3, md: 2.5 },
        }}
      >
        <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 750 }}>TEAMS</Typography>
        <TextField
          size="small"
          label="Search teams"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", md: 290 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {listError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={() => setReloadTeams((n) => n + 1)}>Retry</Button>}
        >
          {listError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.05fr) minmax(0, 0.95fr)" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Box component="section" aria-label="Teams list" sx={{ minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {pageData.totalElements} {pageData.totalElements === 1 ? "team" : "teams"}
            </Typography>
            {loadingTeams && <CircularProgress size={20} />}
          </Stack>

          <Stack sx={{ gap: 1.4 }}>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                selected={activeId === team.id}
                canManage={canManage}
                onSelect={() => selectTeam(team.id, compact)}
                onEdit={() => openForm(team)}
                onDelete={() => setDeleteTarget(team)}
              />
            ))}
            {!loadingTeams && !teams.length && (
              <Paper sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>No teams found</Typography>
                <Typography variant="body2" color="text.secondary">
                  {admin ? "Create the first team, or try a different search." : "You are not a member of any matching team."}
                </Typography>
              </Paper>
            )}
          </Stack>

          {pageData.totalPages > 1 && (
            <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", justifyContent: "center", mt: 2 }}>
              <Button disabled={page <= 0 || loadingTeams} onClick={() => goToPage(page - 1)}>Previous</Button>
              <Typography variant="caption">Page {pageData.page + 1} of {pageData.totalPages}</Typography>
              <Button disabled={page + 1 >= pageData.totalPages || loadingTeams} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </Stack>
          )}
        </Box>
        <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 0, pt: 3.75 }}>{details}</Box>
      </Box>

      {compact && (
        <Drawer
          anchor="right"
          open={detailOpen && Boolean(activeId)}
          onClose={() => setDetailOpen(false)}
          slotProps={{ paper: { sx: { width: { xs: "100%", sm: 560 }, maxWidth: "100vw", bgcolor: "background.default" } } }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: 1, pb: 1.5 }}>
              <Typography sx={{ fontWeight: 750 }}>Team details</Typography>
              <IconButton onClick={() => setDetailOpen(false)} aria-label="Close team details">
                <CloseRounded />
              </IconButton>
            </Stack>
            {details}
          </Box>
        </Drawer>
      )}

      {/* mounted only while open so the form starts fresh each time */}
      {formOpen && (
        <TeamFormDrawer open team={formTeam} busy={busy} error={formError} onClose={() => setFormOpen(false)} onSave={saveTeam} />
      )}
      {memberDrawerOpen && Boolean(activeId) && (
        <TeamMemberDrawer
          open
          workspaceId={workspaceId}
          currentMembers={memberPage.content}
          busy={busy}
          onClose={() => setMemberDrawerOpen(false)}
          onAdd={addMembers}
        />
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={busy ? undefined : () => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete team?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete “{deleteTarget?.name}”? This cannot be undone. Workspace members and their project access will
            remain unchanged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button disabled={busy} color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(removeTarget)} onClose={busy ? undefined : () => setRemoveTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Remove team member?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove {removeTarget && memberLabel(removeTarget)} from this team? Their workspace and project access will
            stay unchanged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button disabled={busy} color="error" onClick={confirmRemove}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice || actionError)}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={actionError ? "error" : "success"} variant="filled" onClose={closeSnackbar}>
          {actionError || notice}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamsPage;

import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Link, Paper, Typography } from "@mui/material";
import { Add, PersonAddAltOutlined, SettingsOutlined } from "@mui/icons-material";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { createTeam, listTeamMembers, listTeams } from "../../api/teamsApi";
import { listProjects } from "../../api/projectsApi";
import { listNotifications } from "../../api/notificationsApi";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { useMyWork } from "../../hooks/useMyWork";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { ROLE_LABEL, isWorkspaceAdmin, isWorkspaceArchived, workspacePath } from "../../utils/workspace";
import { projectTabPath } from "../../utils/project";
import { setupSteps } from "../../utils/myWork";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import LoadState from "../../components/general/LoadState";
import TeamsPanel from "../../components/workspace/TeamsPanel";
import AssignedToMe from "../../components/workspace/AssignedToMe";
import ActiveSprints from "../../components/workspace/ActiveSprints";
import ProjectCards from "../../components/workspace/ProjectCards";
import RecentUpdates from "../../components/workspace/RecentUpdates";
import GettingStarted from "../../components/workspace/GettingStarted";
import NameDialog from "../../components/workspace/NameDialog";
import InviteDialog from "../../components/workspace/InviteDialog";
import WorkspaceSettingsDialog from "../../components/workspace/WorkspaceSettingsDialog";
import CreateProjectDialog from "../../components/projects/CreateProjectDialog";
import { useLatched } from "../../hooks/useLatched";
import { LOADING_DELAY_SX, reveal, revealChildren } from "../../theme/motion";

const columnSx = { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 };
const TEAMS_SHOWN = 5;
const UPDATES_SHOWN = 8;

// the first teams with a member count and a few members for the avatars.
// TODO: one request per team; ask the backend to include these in the list response
const loadTeams = async (workspaceId, signal) => {
  const page = await listTeams(workspaceId, { size: TEAMS_SHOWN }, signal);
  const items = await Promise.all(
    page.content.map(async (team) => {
      const members = await listTeamMembers(team.id, { size: 3 }, signal);
      return { ...team, memberCount: members.totalElements, memberPreview: members.content };
    }),
  );
  return { items, total: page.totalElements };
};

// size 1: only the totals are needed
const loadCounts = async (workspaceId, signal) => {
  const [projects, members] = await Promise.all([
    listProjects(workspaceId, { size: 1 }, signal),
    listWorkspaceMembers(workspaceId, { size: 1 }, signal),
  ]);
  return { projects: projects.totalElements, members: members.totalElements };
};

// /workspaces/:workspaceSlug, the home page: WorkspaceAccessGuard has loaded the workspace
// (and remounts this page when the workspace changes, so nothing from the previous one is shown)
const WorkspacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace, reloadWorkspace } = useWorkspaceAccess();
  const workspaceId = workspace.id;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const shownSettingsOpen = useLatched(settingsOpen || null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const shownProjectDialog = useLatched(projectDialogOpen || null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  const teams = useAsync((signal) => loadTeams(workspaceId, signal), [workspaceId], {
    fallback: "Couldn't load the teams. Please try again.",
  });
  // the counts are extras: without them the header and section titles just leave the numbers out
  const countsState = useAsync((signal) => loadCounts(workspaceId, signal), [workspaceId]);
  const counts = countsState.data;
  const feed = useAsync((signal) => listNotifications({ workspaceId, size: UPDATES_SHOWN }, signal), [workspaceId], {
    fallback: "Couldn't load the updates. Please try again.",
  });
  const work = useMyWork(workspaceId, user?.id);
  // without a user id the hook never starts, which isn't loading
  const workLoading = Boolean(user?.id) && work.loading;

  const isAdmin = isWorkspaceAdmin(workspace);
  const archived = isWorkspaceArchived(workspace);
  const myProjects = work.data?.projects;

  // the setup checklist waits for every total it reads, so steps don't tick on one by one as they load
  const setupReady = isAdmin && !archived && counts && teams.data && myProjects;
  const steps =
    setupReady &&
    setupSteps({
      projects: counts.projects,
      members: counts.members,
      teams: teams.data.total,
      tasks: myProjects.reduce((sum, summary) => sum + summary.board.total, 0),
    });
  // The sections wait for every first load (loaded or failed), then come in one after another, top to bottom, so
  // nothing arrives out of order or pushes the page down (the setup checklist used to appear last, above all).
  // Only the first load: later reloads (a new team) update in place.
  const allLoaded = !workLoading && !teams.loading && !feed.loading && !(isAdmin && !archived && countsState.loading);
  const [ready, setReady] = useState(false);
  if (allLoaded && !ready) setReady(true);
  // the order: the checklist (when shown), Your projects, then the main column a step ahead of the side one
  const first = steps ? 1 : 0;

  const firstProject = myProjects?.[0]?.project;
  const setupActions = {
    project: { label: "Create project", onClick: () => setProjectDialogOpen(true) },
    invite: { label: "Invite people", onClick: () => setInviteOpen(true) },
    team: { label: "Create team", onClick: () => setTeamDialogOpen(true) },
    // tasks live in a project; without one, the first step comes first
    task: firstProject && { label: "Open board", to: projectTabPath(workspace, firstProject, "board") },
  };

  const subtitle = (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1, rowGap: 0.5, color: "text.secondary" }}>
      <Typography component="span">{ROLE_LABEL[workspace.role]}</Typography>
      {counts && (
        <>
          <Box component="span" aria-hidden="true">·</Box>
          <Link
            component={RouterLink}
            to={`${workspacePath(workspace)}/members`}
            color="inherit"
          >
            {counts.members} {counts.members === 1 ? "member" : "members"}
          </Link>
        </>
      )}
      {archived && <Chip label="Archived" size="small" color="warning" sx={{ ml: 0.5 }} />}
    </Box>
  );

  const actions = (
    <>
      {isAdmin && !archived && (
        <Button variant="outlined" startIcon={<PersonAddAltOutlined />} onClick={() => setInviteOpen(true)}>
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
          onClick={() => setSettingsOpen(true)}
        >
          Workspace settings
        </Button>
      )}
      {/* any member can create projects */}
      {!archived && (
        <Button variant="contained" startIcon={<Add />} onClick={() => setProjectDialogOpen(true)}>
          Create project
        </Button>
      )}
    </>
  );

  return (
    <PageLayout>
      <PageHeader title={workspace.name} subtitle={subtitle} actions={actions} />
      {archived && (
        <Alert severity="info" sx={{ mb: 3 }}>This workspace is archived and read-only.</Alert>
      )}

      {!ready ? (
        // a slow load shows a skeleton after 200ms
        <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, ...LOADING_DELAY_SX }}>
          <LoadState loading rows={5} />
        </Paper>
      ) : (
        <Box sx={columnSx}>
          {steps && <GettingStarted workspaceId={workspaceId} steps={steps} actions={setupActions} sx={reveal(0)} />}
          {/* the full, searchable list is the Projects page ("View all projects") */}
          <ProjectCards projects={myProjects} loading={workLoading} workspaceTotal={counts?.projects} sx={reveal(first)} />

          {/* main: what I own and what happened; side: what's running and who's here */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(320px, 1fr)" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Box sx={{ ...columnSx, ...revealChildren(first + 1) }}>
              <AssignedToMe items={work.data?.items} loading={workLoading} error={work.error} onRetry={work.reload} />
              <RecentUpdates feed={feed} />
            </Box>

            <Box sx={{ ...columnSx, ...revealChildren(first + 2) }}>
              {/* only when some Scrum project runs a sprint */}
              {work.data?.sprints.length > 0 && <ActiveSprints sprints={work.data.sprints} />}
              <TeamsPanel
                teams={teams.data}
                loading={teams.loading && !teams.data}
                error={teams.error}
                onRetry={teams.reload}
                teamsPath={`${workspacePath(workspace)}/teams`}
                canCreate={isAdmin && !archived}
                onCreate={() => setTeamDialogOpen(true)}
              />
            </Box>
          </Box>
        </Box>
      )}

      <InviteDialog open={inviteOpen} workspaceId={workspaceId} onClose={() => setInviteOpen(false)} />
      {shownSettingsOpen && (
        <WorkspaceSettingsDialog
          open={settingsOpen}
          workspace={workspace}
          onClose={() => setSettingsOpen(false)}
          onChanged={reloadWorkspace}
          onDeleted={() => navigate("/workspaces")}
        />
      )}
      {/* opens the new project once it's created */}
      {shownProjectDialog && <CreateProjectDialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} />}
      <NameDialog
        open={teamDialogOpen}
        title="Create team"
        label="Team name"
        onClose={() => setTeamDialogOpen(false)}
        onSubmit={async (name) => {
          await createTeam(workspaceId, name);
          teams.reload();
        }}
      />
    </PageLayout>
  );
};

export default WorkspacePage;

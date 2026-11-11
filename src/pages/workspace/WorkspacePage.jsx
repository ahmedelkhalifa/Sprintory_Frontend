import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Link, Typography } from "@mui/material";
import { Add, PersonAddAltOutlined, SettingsOutlined } from "@mui/icons-material";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { createTeam, listTeamMembers, listTeams } from "../../api/teamsApi";
import { listProjects } from "../../api/projectsApi";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { useMyWork } from "../../hooks/useMyWork";
import { usePagedList } from "../../hooks/usePagedList";
import { useMembersPreview } from "../../hooks/useProjectsOverview";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { ROLE_LABEL, isWorkspaceAdmin, isWorkspaceArchived, workspacePath } from "../../utils/workspace";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import ProjectsTable from "../../components/projects/ProjectsTable";
import TeamsPanel from "../../components/workspace/TeamsPanel";
import AssignedToMe from "../../components/workspace/AssignedToMe";
import ActiveSprints from "../../components/workspace/ActiveSprints";
import NameDialog from "../../components/workspace/NameDialog";
import InviteDialog from "../../components/workspace/InviteDialog";
import WorkspaceSettingsDialog from "../../components/workspace/WorkspaceSettingsDialog";
import CreateProjectDialog from "../../components/projects/CreateProjectDialog";

const PROJECTS_PAGE_SIZE = 8;
const columnSx = { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 };
const TEAMS_SHOWN = 5;

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
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  const projects = usePagedList((params, signal) => listProjects(workspaceId, params, signal), [workspaceId], {
    size: PROJECTS_PAGE_SIZE,
    fallback: "Couldn't load the projects. Please try again.",
  });
  const previews = useMembersPreview(projects.items.map((project) => project.id));
  const teams = useAsync((signal) => loadTeams(workspaceId, signal), [workspaceId], {
    fallback: "Couldn't load the teams. Please try again.",
  });
  // the counts are extras: without them the header and section titles just leave the numbers out
  const { data: counts } = useAsync((signal) => loadCounts(workspaceId, signal), [workspaceId]);
  const work = useMyWork(workspaceId, user?.id);
  // without a user id the hook never starts, which isn't loading
  const workLoading = Boolean(user?.id) && work.loading;

  const isAdmin = isWorkspaceAdmin(workspace);
  const archived = isWorkspaceArchived(workspace);
  const query = projects.search.trim();

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

      {/* work first (what I own, what's running), then the workspace's projects and teams */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(320px, 1fr)" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={columnSx}>
          <AssignedToMe items={work.data?.items} loading={workLoading} error={work.error} onRetry={work.reload} />
          <SectionCard
            title="Projects"
            count={counts?.projects}
            toolbar={<SearchField value={projects.search} onChange={projects.setSearch} placeholder="Search projects" />}
          >
            <LoadState
              loading={projects.loading}
              error={projects.error}
              onRetry={projects.reload}
              isEmpty={projects.items.length === 0}
              emptyMessage={query ? `No projects match "${query}".` : "No projects yet."}
            >
              <ProjectsTable projects={projects.items} previews={previews} />
              <Pager
                page={projects.page}
                size={projects.size}
                total={projects.total}
                totalPages={projects.totalPages}
                shown={projects.items.length}
                noun="project"
                onPageChange={projects.setPage}
              />
            </LoadState>
          </SectionCard>
        </Box>

        <Box sx={columnSx}>
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

      <InviteDialog open={inviteOpen} workspaceId={workspaceId} onClose={() => setInviteOpen(false)} />
      {settingsOpen && (
        <WorkspaceSettingsDialog
          workspace={workspace}
          onClose={() => setSettingsOpen(false)}
          onChanged={reloadWorkspace}
          onDeleted={() => navigate("/workspaces")}
        />
      )}
      {/* opens the new project once it's created */}
      {projectDialogOpen && <CreateProjectDialog onClose={() => setProjectDialogOpen(false)} />}
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

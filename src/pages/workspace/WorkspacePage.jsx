import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Tab, Tabs } from "@mui/material";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { createTeam, listTeamMembers, listTeams } from "../../api/teamsApi";
import { listProjectMembers, listProjects } from "../../api/projectsApi";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { isAbort } from "../../utils/apiError";
import { EMPTY_PAGE } from "../../utils/page";
import { projectsPath } from "../../utils/project";
import { ROLE_LABEL, isWorkspaceAdmin, isWorkspaceArchived } from "../../utils/workspace";
import WorkspaceHeader from "../../components/workspace/WorkspaceHeader";
import StatCards from "../../components/workspace/StatCards";
import ProjectsTable from "../../components/workspace/ProjectsTable";
import TeamsPanel from "../../components/workspace/TeamsPanel";
import RecentActivity from "../../components/workspace/RecentActivity";
import NameDialog from "../../components/workspace/NameDialog";
import InviteDialog from "../../components/workspace/InviteDialog";
import WorkspaceSettingsDialog from "../../components/workspace/WorkspaceSettingsDialog";
import CreateProjectDialog from "../../components/projects/CreateProjectDialog";
import { ACTIVITY } from "../../components/workspace/mockData";

const PROJECTS_PAGE_SIZE = 8;

// adds a member count and the first few members (for the avatars) to each team/project.
// TODO: one request per item; ask the backend to include these in the list responses
const withMembers = (items, listMembers, signal) =>
  Promise.all(
    items.map(async (item) => {
      const members = await listMembers(item.id, { size: 3 }, signal);
      return { ...item, memberCount: members.totalElements, memberPreview: members.content };
    }),
  );

// /workspaces/:workspaceId: WorkspaceAccessGuard has loaded the workspace
// (and remounts this page when the workspace changes, so nothing from the previous one is shown)
const WorkspacePage = () => {
  const navigate = useNavigate();
  const { workspace, reloadWorkspace } = useWorkspaceAccess();
  const workspaceId = workspace.id;

  const [refresh, setRefresh] = useState(0); // bump to reload the lists after a change
  const reload = () => setRefresh((n) => n + 1);

  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState(EMPTY_PAGE);
  const [projectPage, setProjectPage] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState({ projects: 0, teams: 0, members: 0 });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listTeams(workspaceId, { size: 5 }, controller.signal)
      .then((page) => withMembers(page.content, listTeamMembers, controller.signal))
      .then(setTeams)
      .catch((err) => {
        if (!isAbort(err)) setTeams([]);
      });
    return () => controller.abort();
  }, [workspaceId, refresh]);

  // only search once the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // aborting the previous request means an older, slower response can't overwrite a newer one
  useEffect(() => {
    const controller = new AbortController();
    listProjects(workspaceId, { page: projectPage, size: PROJECTS_PAGE_SIZE, q: query || undefined }, controller.signal)
      .then(async (page) => ({ ...page, content: await withMembers(page.content, listProjectMembers, controller.signal) }))
      .then(setProjects)
      .catch((err) => {
        if (!isAbort(err)) setProjects(EMPTY_PAGE);
      });
    return () => controller.abort();
  }, [workspaceId, projectPage, query, refresh]);

  // size 1: only totalElements is needed
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      listProjects(workspaceId, { size: 1 }, signal),
      listTeams(workspaceId, { size: 1 }, signal),
      listWorkspaceMembers(workspaceId, { size: 1 }, signal),
    ])
      .then(([p, t, m]) => setCounts({ projects: p.totalElements, teams: t.totalElements, members: m.totalElements }))
      .catch(() => {}); // the cards just keep showing 0
    return () => controller.abort();
  }, [workspaceId, refresh]);

  const isAdmin = isWorkspaceAdmin(workspace);
  const archived = isWorkspaceArchived(workspace);
  const teamsPath = `/workspaces/${workspace.id}/teams`;

  const stats = [
    { key: "projects", value: counts.projects, label: "Projects", to: projectsPath(workspace.id) },
    { key: "teams", value: counts.teams, label: "Teams", to: teamsPath },
    { key: "members", value: counts.members, label: "Members" },
    { key: "active", value: "—", label: "Active this week" }, // TODO: no endpoint yet
  ];

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 } }}>
      <WorkspaceHeader
        name={workspace.name}
        role={ROLE_LABEL[workspace.role]}
        archived={archived}
        isAdmin={isAdmin}
        onInvite={() => setInviteOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onCreateProject={() => setProjectDialogOpen(true)}
      />
      {archived && (
        <Alert severity="info" sx={{ mt: 2 }}>This workspace is archived and read-only.</Alert>
      )}

      {/* more tabs (projects, people, ...) get added here as their pages exist */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3, mb: 3 }}>
        <Tabs value="overview">
          <Tab value="overview" label="Overview" sx={{ textTransform: "none", fontWeight: 500 }} />
          <Tab
            value="projects"
            label="Projects"
            component={RouterLink}
            to={projectsPath(workspace.id)}
            sx={{ textTransform: "none", fontWeight: 500 }}
          />
          <Tab
            value="teams"
            label="Teams"
            component={RouterLink}
            to={teamsPath}
            sx={{ textTransform: "none", fontWeight: 500 }}
          />
        </Tabs>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <StatCards stats={stats} />
          <ProjectsTable
            projects={projects.content}
            total={projects.totalElements}
            totalPages={projects.totalPages}
            page={projectPage}
            onPageChange={setProjectPage}
            search={search}
            onSearch={(value) => {
              setSearch(value);
              setProjectPage(0);
            }}
            canCreate={!archived}
            onCreate={() => setProjectDialogOpen(true)}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TeamsPanel
            teams={teams}
            teamsPath={teamsPath}
            canCreate={isAdmin && !archived}
            onCreate={() => setTeamDialogOpen(true)}
          />
          <RecentActivity items={ACTIVITY} />
        </Box>
      </Box>

      <InviteDialog open={inviteOpen} workspaceId={workspace.id} onClose={() => setInviteOpen(false)} />
      {settingsOpen && (
        <WorkspaceSettingsDialog
          workspace={workspace}
          onClose={() => setSettingsOpen(false)}
          onChanged={reloadWorkspace}
          onDeleted={() => navigate("/workspaces")}
        />
      )}
      {/* opens the new project once it's created */}
      {projectDialogOpen && (
        <CreateProjectDialog workspaceId={workspace.id} onClose={() => setProjectDialogOpen(false)} />
      )}
      <NameDialog
        open={teamDialogOpen}
        title="Create team"
        label="Team name"
        onClose={() => setTeamDialogOpen(false)}
        onSubmit={async (name) => {
          await createTeam(workspace.id, name);
          reload();
        }}
      />
    </Box>
  );
};

export default WorkspacePage;

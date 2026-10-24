import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Tab, Tabs } from "@mui/material";
import WorkspaceHeader from "./WorkspaceHeader";
import StatCards from "./StatCards";
import ProjectsTable from "./ProjectsTable";
import TeamsPanel from "./TeamsPanel";
import RecentActivity from "./RecentActivity";
import NameDialog from "./NameDialog";
import InviteDialog from "./InviteDialog";
import WorkspaceSettingsDialog from "./WorkspaceSettingsDialog";
import { ACTIVITY, STATS } from "./mockData";
import { getWorkspace, getWorkspaceMembers } from "../../api/workspaces";
import { createTeam, getTeamMembers, getTeams } from "../../api/teams";
import { createProject, getProjectMembers, getProjects } from "../../api/projects";
import { errorMessage } from "../../utils/apiError";

const ROLE_LABEL = { WORKSPACE_ADMIN: "Admin", WORKSPACE_MEMBER: "Member" };
const TABS = ["Overview", "Projects", "Teams", "People", "Settings"];
const EMPTY_PAGE = { content: [], totalPages: 1, totalElements: 0 };

// Adds a member count and the first few members to each item (for the avatars)
const withMembers = (items, getMembers) =>
    Promise.all(
        items.map(async (item) => {
            const m = await getMembers(item.id, { size: 3 });
            return { ...item, memberCount: m.totalElements, memberPreview: m.content };
        })
    );

function WorkspacePage() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState(null);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(0);
    const [refresh, setRefresh] = useState(0); // bump to reload the lists after a change
    const reload = () => setRefresh((n) => n + 1);

    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState(EMPTY_PAGE);
    const [projectPage, setProjectPage] = useState(0);
    const [search, setSearch] = useState("");
    const [counts, setCounts] = useState({ projects: 0, teams: 0, members: 0 });

    const [inviteOpen, setInviteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);

    useEffect(() => {
        getWorkspace(workspaceId)
            .then(setWorkspace)
            .catch((err) => setError(errorMessage(err)));
    }, [workspaceId]);

    useEffect(() => {
        getTeams(workspaceId, { size: 5 })
            .then((page) => withMembers(page.content, getTeamMembers))
            .then(setTeams)
            .catch(() => setTeams([]));
    }, [workspaceId, refresh]);

    useEffect(() => {
        getProjects(workspaceId, { page: projectPage, size: 8, q: search || undefined })
            .then(async (res) => ({ ...res, content: await withMembers(res.content, getProjectMembers) }))
            .then(setProjects)
            .catch(() => setProjects(EMPTY_PAGE));
    }, [workspaceId, projectPage, search, refresh]);

    useEffect(() => {
        Promise.all([
            getProjects(workspaceId, { size: 1 }),
            getTeams(workspaceId, { size: 1 }),
            getWorkspaceMembers(workspaceId, { size: 1 }),
        ])
            .then(([p, t, m]) =>
                setCounts({ projects: p.totalElements, teams: t.totalElements, members: m.totalElements })
            )
            .catch(() => {});
    }, [workspaceId, refresh]);

    if (error) return <Alert severity="error">Could not load workspace: {error}</Alert>;
    if (!workspace) return <CircularProgress />;

    const isAdmin = workspace.role === "WORKSPACE_ADMIN";
    const archived = Boolean(workspace.archivedAt);

    const stats = [
        { key: "projects", value: counts.projects, label: "Projects" },
        { key: "teams", value: counts.teams, label: "Teams" },
        { key: "members", value: counts.members, label: "Members" },
        STATS[3], // TODO: "Active this week" has no endpoint yet
    ];

    return (
        <Box>
            <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 }, py: 0 }}>
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
                    <Alert severity="info" sx={{ mt: 2 }}>
                        This workspace is archived and read-only.
                    </Alert>
                )}

                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3, mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        {TABS.map((t) => (
                            <Tab key={t} label={t} sx={{ textTransform: "none", fontWeight: 500 }} />
                        ))}
                    </Tabs>
                </Box>

                {tab === 0 && (
                    <Box sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
                        gap: 3,
                        alignItems: "start",
                    }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <StatCards stats={stats} />
                            <ProjectsTable
                                projects={projects.content}
                                total={projects.totalElements}
                                totalPages={projects.totalPages}
                                page={projectPage}
                                onPageChange={setProjectPage}
                                search={search}
                                onSearch={(value) => { setSearch(value); setProjectPage(0); }}
                                canCreate={!archived}
                                onCreate={() => setProjectDialogOpen(true)}
                            />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <TeamsPanel
                                teams={teams}
                                canCreate={isAdmin && !archived}
                                onCreate={() => setTeamDialogOpen(true)}
                            />
                            <RecentActivity items={ACTIVITY} />
                        </Box>
                    </Box>
                )}
            </Box>

            <InviteDialog
                open={inviteOpen}
                workspaceId={workspace.id}
                onClose={() => setInviteOpen(false)}
            />
            <WorkspaceSettingsDialog
                open={settingsOpen}
                workspace={workspace}
                onClose={() => setSettingsOpen(false)}
                onChanged={setWorkspace}
                onDeleted={() => navigate("/workspaces")}
            />
            <NameDialog
                open={projectDialogOpen}
                title="Create project"
                label="Project name"
                onClose={() => setProjectDialogOpen(false)}
                onSubmit={async (name) => { await createProject(workspace.id, name); reload(); }}
            />
            <NameDialog
                open={teamDialogOpen}
                title="Create team"
                label="Team name"
                onClose={() => setTeamDialogOpen(false)}
                onSubmit={async (name) => { await createTeam(workspace.id, name); reload(); }}
            />
        </Box>
    );
}

export default WorkspacePage;
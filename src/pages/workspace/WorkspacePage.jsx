
import { getProjects, getProjectMembers } from "../../api/projects";
import { getTeams, getTeamMembers } from "../../api/teams";
import { Box, Tab, Tabs } from "@mui/material";
import WorkspaceHeader from "./WorkspaceHeader";
import StatCards from "./StatCards";
import ProjectsTable from "./ProjectsTable";
import TeamsPanel from "./TeamsPanel";
import RecentActivity from "./RecentActivity";
import { ACTIVITY, STATS } from "./mockData";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, CircularProgress } from "@mui/material";
import { getWorkspace } from "../../api/workspaces";

const ROLE_LABEL = { WORKSPACE_ADMIN: "Admin", WORKSPACE_MEMBER: "Member" };
const TABS = ["Overview", "Projects", "Teams", "People", "Settings"];

function WorkspacePage() {
    const { workspaceId } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(0);
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState({ content: [], totalPages: 1, totalElements: 0 });
    const [projectPage, setProjectPage] = useState(0);
    const [search, setSearch] = useState("");

    useEffect(() => {
        getProjects(workspaceId, { page: projectPage, size: 8, q: search || undefined })
            .then(async (res) => {
                const content = await Promise.all(
                    res.content.map(async (p) => {
                        const m = await getProjectMembers(p.id, { size: 3 });
                        return { ...p, memberCount: m.totalElements, memberPreview: m.content };
                    })
                );
                setProjects({ ...res, content });
            })
            .catch(() => setProjects({ content: [], totalPages: 1, totalElements: 0 }));
    }, [workspaceId, projectPage, search]);

    useEffect(() => {
        getTeams(workspaceId, { size: 5 })
            .then(async (page) => {
                const withMembers = await Promise.all(
                    page.content.map(async (t) => {
                        const m = await getTeamMembers(t.id, { size: 3 });
                        return { ...t, memberCount: m.totalElements, memberPreview: m.content };
                    })
                );
                setTeams(withMembers);
            })
    }, [workspaceId]);

    useEffect(() => {
        getWorkspace(workspaceId)
            .then(setWorkspace)
            .catch((err) => setError(err.response?.data?.code ?? "NETWORK_ERROR"));
    }, [workspaceId]);

    if (error) return <Alert severity="error">Could not load workspace ({error})</Alert>;
    if (!workspace) return <CircularProgress />;

    return (
        <Box sx={{ }}>

            <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 }, py: 0 }}>
                <WorkspaceHeader name={workspace.name} role={ROLE_LABEL[workspace.role]} />
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
                            <StatCards stats={STATS} />
                            <ProjectsTable
                                projects={projects.content}
                                total={projects.totalElements}
                                totalPages={projects.totalPages}
                                page={projectPage}
                                onPageChange={setProjectPage}
                                search={search}
                                onSearch={(value) => { setSearch(value); setProjectPage(0); }}
                            />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <TeamsPanel teams={teams} />
                            <RecentActivity items={ACTIVITY} />
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default WorkspacePage;
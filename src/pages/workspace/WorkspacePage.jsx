
import { Box, Tab, Tabs } from "@mui/material";
import WorkspaceHeader from "./WorkspaceHeader";
import StatCards from "./StatCards";
import ProjectsTable from "./ProjectsTable";
import TeamsPanel from "./TeamsPanel";
import RecentActivity from "./RecentActivity";
import { ACTIVITY, PROJECTS, STATS, TEAMS } from "./mockData";
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

    useEffect(() => {
        getWorkspace(workspaceId)
            .then(setWorkspace)
            .catch((err) => setError(err.response?.data?.code ?? "NETWORK_ERROR"));
    }, [workspaceId]);

    if (error) return <Alert severity="error">Could not load workspace ({error})</Alert>;
    if (!workspace) return <CircularProgress />;

    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>

            <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 }, py: 25 }}>
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
                            <ProjectsTable projects={PROJECTS} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <TeamsPanel teams={TEAMS} />
                            <RecentActivity items={ACTIVITY} />
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default WorkspacePage;